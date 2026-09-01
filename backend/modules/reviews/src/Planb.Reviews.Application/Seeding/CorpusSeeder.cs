using Microsoft.Extensions.Logging;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Domain.Catalog;
using Planb.Reviews.Domain.Reviews;
using Planb.SharedKernel.Abstractions.Clock;

namespace Planb.Reviews.Application.Seeding;

/// <summary>
/// Materializa el corpus de <see cref="CorpusSeedData"/> (#374): las reseñas que hacen que las
/// fichas tengan qué mostrar. Sin esto, todo lo que el producto construyó muestra cero, y una ficha
/// en cero no demuestra nada.
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
/// busca por (cuenta, materia, período), que es su clave natural, antes de insertar.
/// </para>
/// </summary>
public sealed class CorpusSeeder
{
    private readonly IReviewRepository _reviews;
    private readonly ICatalogRepository _catalog;
    private readonly IReviewsUnitOfWork _unitOfWork;
    private readonly IDateTimeProvider _clock;
    private readonly ILogger<CorpusSeeder> _log;

    public CorpusSeeder(
        IReviewRepository reviews,
        ICatalogRepository catalog,
        IReviewsUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        ILogger<CorpusSeeder> log)
    {
        _reviews = reviews;
        _catalog = catalog;
        _unitOfWork = unitOfWork;
        _clock = clock;
        _log = log;
    }

    public async Task SeedAsync(CancellationToken ct = default)
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
        var inserted = 0;

        foreach (var seed in CorpusSeedData.Reviews)
        {
            var accountId = CorpusSeedData.AccountId(seed.AccountIndex);

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
                instrument.Id,
                seed.Answers.Select(a => (a.ItemId, a.OptionValue)),
                freeText: null,
                createdAt: now,
                updatedAt: now);

            await _reviews.AddAsync(review, ct);
            inserted++;
        }

        if (inserted > 0)
        {
            await _unitOfWork.SaveChangesAsync(ct);
            _log.LogInformation("CorpusSeeder: inserted {Count} reviews", inserted);
        }
    }
}
