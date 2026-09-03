using Microsoft.Extensions.Logging;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Domain.Catalog;
using Planb.SharedKernel.Abstractions.Clock;

namespace Planb.Reviews.Application.Seeding;

/// <summary>
/// Materializa el catálogo aprobado (issue #357): las 14 frases de <see cref="CatalogSeedData"/> y el
/// instrumento <c>STUDENT_COURSE</c> v1 que los publica. Construye los aggregates con
/// <see cref="Item.Hydrate"/> e <see cref="Instrument.Hydrate"/> (ids pre-asignados, mismo camino que
/// usa cualquier carga inicial de catálogo), no con SQL crudo.
///
/// <para>
/// Idempotente por identidad semántica, no por "está vacía la tabla" (ADR-0058): cada frase se busca
/// por su <see cref="Item.Code"/> y el instrumento por su código+vigencia antes de insertar, así que
/// correrlo sobre una base ya sembrada no duplica nada y agregar una frase nueva al manifiesto lo
/// inserta sin tocar el resto.
/// </para>
/// </summary>
public sealed class CatalogSeeder
{
    private readonly ICatalogRepository _catalog;
    private readonly IReviewsUnitOfWork _unitOfWork;
    private readonly IDateTimeProvider _clock;
    private readonly ILogger<CatalogSeeder> _log;

    public CatalogSeeder(
        ICatalogRepository catalog,
        IReviewsUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        ILogger<CatalogSeeder> log)
    {
        _catalog = catalog;
        _unitOfWork = unitOfWork;
        _clock = clock;
        _log = log;
    }

    public async Task SeedAsync(CancellationToken ct = default)
    {
        var now = _clock.UtcNow;

        var insertedItems = 0;
        foreach (var seed in CatalogSeedData.Items)
        {
            if (await _catalog.GetItemByCodeAsync(seed.Code, ct) is not null)
            {
                continue;
            }

            var item = Item.Hydrate(
                seed.Id,
                seed.Code,
                seed.Text,
                seed.Help,
                seed.Layer,
                seed.Subject,
                seed.Options,
                isActive: true,
                createdAt: now,
                updatedAt: now);

            await _catalog.AddItemAsync(item, ct);
            insertedItems++;
        }

        // El instrumento referencia las 14 frases del manifiesto completo (no solo las recién
        // insertadas en esta corrida): si una corrida previa insertó las frases pero se cortó antes de
        // publicar el instrumento, esta sigue encontrándolos por su id determinístico igual.
        var publishedInstrument = false;
        if (await _catalog.GetCurrentInstrumentAsync(CatalogSeedData.StudentCourseCode, ct) is null)
        {
            var instrument = Instrument.Hydrate(
                CatalogSeedData.StudentCourseInstrumentId,
                CatalogSeedData.StudentCourseCode,
                CatalogSeedData.StudentCourseVersion,
                CatalogSeedData.Items.Select((seed, index) => (seed.Id, (short)(index + 1))),
                validFrom: now,
                validUntil: null);

            await _catalog.AddInstrumentAsync(instrument, ct);
            publishedInstrument = true;
        }

        if (insertedItems > 0 || publishedInstrument)
        {
            await _unitOfWork.SaveChangesAsync(ct);
            _log.LogInformation(
                "CatalogSeeder: inserted {Items} items; instrument {Code} v{Version} published: {Published}.",
                insertedItems,
                CatalogSeedData.StudentCourseCode,
                CatalogSeedData.StudentCourseVersion,
                publishedInstrument);
        }
    }
}
