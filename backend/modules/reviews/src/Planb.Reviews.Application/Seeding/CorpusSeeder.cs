using Microsoft.Extensions.Logging;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Domain.Catalog;
using Planb.Reviews.Domain.Curation;
using Planb.Reviews.Domain.Reviews;
using Planb.SharedKernel.Abstractions.Clock;

namespace Planb.Reviews.Application.Seeding;

/// <summary>
/// Materializa el corpus de <see cref="CorpusSeedData"/>: las reseñas que hacen que las fichas
/// tengan qué mostrar. Sin esto, todo lo que el producto construyó muestra cero, y una ficha en
/// cero no demuestra nada.
///
/// <para>
/// Es <b>corpus de demostración</b>, no catálogo de referencia: va en el nivel 2 de
/// <see href="../../../../../docs/decisions/0058-deterministic-seed-in-code-gated-by-environment.md">ADR-0058</see>,
/// gateado por <c>PLANB_SEED_CORPUS</c>. Los integration tests corren en Development sin esa
/// variable, así que su base sigue naciendo vacía y sus conteos siguen siendo los que ellos mismos
/// publican.
/// </para>
///
/// <para>
/// Idempotente por identidad semántica y no por "está vacía la tabla" (ADR-0058): cada cursada se
/// busca por (cuenta, materia, período), que es su clave natural, antes de insertar. El corte de
/// serie de la frase se busca por el código de la sucesora, y la nota editorial por si la carrera ya
/// tiene alguna: correr esto dos veces no duplica nada de lo tres.
/// </para>
/// </summary>
public sealed class CorpusSeeder
{
    /// <summary>
    /// La Tecnicatura de UNSTA (ver <c>AcademicSeedData</c>): la única carrera del corpus con nota
    /// editorial, porque es la única ficha de carrera que el modelo vigente puede publicar hoy.
    /// </summary>
    private static readonly Guid TudcsUnstaCareerId = Guid.Parse("00000002-0000-4000-a000-000000000003");

    private readonly IReviewRepository _reviews;
    private readonly ICatalogRepository _catalog;
    private readonly IEditorialNoteRepository _notes;
    private readonly IEditorialNoteQueryService _noteReads;
    private readonly IReviewsUnitOfWork _unitOfWork;
    private readonly IDateTimeProvider _clock;
    private readonly ILogger<CorpusSeeder> _log;

    public CorpusSeeder(
        IReviewRepository reviews,
        ICatalogRepository catalog,
        IEditorialNoteRepository notes,
        IEditorialNoteQueryService noteReads,
        IReviewsUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        ILogger<CorpusSeeder> log)
    {
        _reviews = reviews;
        _catalog = catalog;
        _notes = notes;
        _noteReads = noteReads;
        _unitOfWork = unitOfWork;
        _clock = clock;
        _log = log;
    }

    /// <param name="luciaAccountId">
    /// El id real de la persona sembrada <c>lucia.mansilla@gmail.com</c>, resuelto por quien llama
    /// (<see cref="Planb.Api.Infrastructure.CorpusSeedHostedService"/>) contra identity antes de
    /// invocar: nace random al registrarse, así que este seeder no lo puede saber de antemano.
    /// Null la deja sin sus dos reseñas propias; el resto del corpus se siembra igual.
    /// </param>
    /// <param name="matiasAccountId">
    /// El id real de la persona sembrada <c>matias.ledesma@gmail.com</c>, resuelto de la misma
    /// forma que <paramref name="luciaAccountId"/>. Null la deja sin su reseña propia; el resto del
    /// corpus se siembra igual.
    /// </param>
    public async Task SeedAsync(
        Guid? luciaAccountId = null, Guid? matiasAccountId = null, CancellationToken ct = default)
    {
        var instrument = await _catalog.GetCurrentInstrumentAsync(CatalogSeedData.StudentCourseCode, ct);
        if (instrument is null)
        {
            // El catálogo lo siembra el nivel 1 y este seeder se registra después, así que llegar
            // acá significa que aquel falló: sin instrumento no hay contra qué responder.
            _log.LogWarning("No hay instrumento vigente: el corpus no se siembra.");
            return;
        }

        var now = _clock.UtcNow;
        var inserted = await InsertReviewsAsync(CorpusSeedData.Reviews, instrument.Id, now, ct);

        var successor = await SeedSyllabusSeriesCutAsync(ct);
        if (successor is not null)
        {
            inserted += await InsertReviewsAsync(
                CorpusSeedData.PostSeriesCutReviews(successor.Id), instrument.Id, now, ct);
        }

        if (luciaAccountId is { } lucia)
        {
            inserted += await InsertReviewsAsync(CorpusSeedData.LuciaReviews(lucia), instrument.Id, now, ct);
        }

        if (matiasAccountId is { } matias)
        {
            inserted += await InsertReviewsAsync(CorpusSeedData.MatiasReviews(matias), instrument.Id, now, ct);
        }

        var notePublished = await SeedEditorialNoteAsync(ct);

        if (inserted > 0 || notePublished)
        {
            await _unitOfWork.SaveChangesAsync(ct);
            _log.LogInformation(
                "CorpusSeeder: inserted {Count} reviews; editorial note published: {Note}.",
                inserted,
                notePublished);
        }
    }

    private async Task<int> InsertReviewsAsync(
        IReadOnlyList<CorpusSeedData.SeededReview> seeds,
        InstrumentId instrumentId,
        DateTimeOffset now,
        CancellationToken ct)
    {
        var inserted = 0;

        foreach (var seed in seeds)
        {
            var accountId = seed.AccountIdOverride ?? CorpusSeedData.AccountId(seed.AccountIndex);

            if (await _reviews.GetByCursadaAsync(accountId, seed.SubjectId, seed.TermId, ct) is not null)
            {
                continue;
            }

            var review = Review.Hydrate(
                seed.Id,
                accountId,
                seed.SubjectId,
                seed.TermId,
                seed.ChairId,
                instrumentId,
                seed.Answers.Select(a => (a.ItemId, a.OptionValue)),
                seed.FreeText,
                createdAt: now,
                updatedAt: now);

            await _reviews.AddAsync(review, ct);
            inserted++;
        }

        return inserted;
    }

    /// <summary>
    /// Corta la serie de <c>CHAIR_SYLLABUS_UPFRONT</c> y abre <c>CHAIR_SYLLABUS_UPFRONT_V2</c> en su
    /// lugar: mismo camino de aggregate que <c>SupersedeItemCommandHandler</c> (US-198), pero sin
    /// actor, porque acá no hay una persona curando el catálogo a la que atribuirle el cambio (mismo
    /// criterio que el resto del seed, que hidrata sin autor cuando no hay a quién ponerle).
    /// Devuelve la frase sucesora, ya existiera de una corrida anterior o recién creada; null si no
    /// se pudo cortar (la frase vieja no está, o el instrumento vigente no se pudo republicar).
    /// </summary>
    private async Task<Item?> SeedSyllabusSeriesCutAsync(CancellationToken ct)
    {
        var existingSuccessor = await _catalog.GetItemByCodeAsync(
            CorpusSeedData.SyllabusUpfrontSuccessorCode, ct);
        if (existingSuccessor is not null)
        {
            return existingSuccessor;
        }

        const string previousCode = "CHAIR_SYLLABUS_UPFRONT";
        var previous = await _catalog.GetItemByCodeAsync(previousCode, ct);
        if (previous is null)
        {
            _log.LogWarning("No se encontró la frase {Code} para cortar su serie.", previousCode);
            return null;
        }

        var created = Item.Create(
            CorpusSeedData.SyllabusUpfrontSuccessorCode,
            "¿Tuviste el programa completo antes de terminar la primera semana de clases?",
            help: null,
            previous.Layer,
            previous.Subject,
            previous.Options.Select(o => (o.Value, o.Order, o.Label, o.Valence)),
            _clock,
            previous.Origin,
            createdBy: null,
            supersedes: previous.Id);

        if (created.IsFailure)
        {
            _log.LogWarning(
                "No se pudo crear la frase sucesora {Code}: {Error}",
                CorpusSeedData.SyllabusUpfrontSuccessorCode,
                created.Error.Code);
            return null;
        }

        var current = await _catalog.GetCurrentInstrumentAsync(CatalogSeedData.StudentCourseCode, ct);
        if (current is null)
        {
            return null;
        }

        var successor = created.Value;

        // El sucesor ocupa el mismo lugar que el viejo en el cuestionario, mismo criterio que
        // SupersedeItemCommandHandler: el orden en que se pregunta no tiene por qué moverse porque
        // una pregunta cambió de significado.
        var items = current.Items
            .OrderBy(i => i.Order)
            .Select(i => i.ItemId == previous.Id ? (successor.Id, i.Order) : (i.ItemId, i.Order))
            .ToList();

        var published = Instrument.Publish(current.Code, (short)(current.Version + 1), items, _clock);
        if (published.IsFailure)
        {
            _log.LogWarning(
                "No se pudo publicar la versión del instrumento que corta la serie: {Error}",
                published.Error.Code);
            return null;
        }

        var retired = previous.Retire(_clock, retiredBy: null);
        if (retired.IsFailure)
        {
            _log.LogWarning("No se pudo retirar {Code}: {Error}", previousCode, retired.Error.Code);
            return null;
        }

        var closed = current.Close(_clock);
        if (closed.IsFailure)
        {
            _log.LogWarning("No se pudo cerrar la versión vigente del instrumento: {Error}", closed.Error.Code);
            return null;
        }

        await _catalog.AddItemAsync(successor, ct);
        await _catalog.AddInstrumentAsync(published.Value, ct);
        return successor;
    }

    /// <summary>
    /// Publica la única nota editorial que el corpus siembra: a nivel carrera, sobre la Tecnicatura
    /// de UNSTA. La lista de personas identificables contra la que <c>EditorialNote.Publish</c>
    /// valida que el texto no nombre a nadie va vacía a propósito: el texto lo escribe este método a
    /// mano, así que la garantía de que no nombra a ningún docente la sostiene quien lo escribió y
    /// no hace falta pedirle a academic el plantel real de la carrera para volver a chequearlo.
    /// </summary>
    private async Task<bool> SeedEditorialNoteAsync(CancellationToken ct)
    {
        var existing = await _noteReads.ListForCareerAsync(TudcsUnstaCareerId, ct);
        if (existing.Count > 0)
        {
            return false;
        }

        const string text =
            "Entre lo que se escribió y no se publica aparecen menciones sueltas a que el horario de "
            + "consulta no siempre coincide con el que figura en el programa. No alcanza todavía para "
            + "una frase nueva del cuestionario, pero queda anotado para la próxima revisión del "
            + "catálogo.";

        var published = EditorialNote.Publish(TudcsUnstaCareerId, text, people: [], _clock);
        if (published.IsFailure)
        {
            _log.LogWarning("No se pudo publicar la nota editorial del corpus: {Error}", published.Error.Code);
            return false;
        }

        await _notes.AddAsync(published.Value, ct);
        return true;
    }
}
