using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Planb.Academic.Domain.CareerPlans;
using Planb.Academic.Domain.Careers;
using Planb.Academic.Domain.Universities;
using Planb.Academic.Infrastructure.Persistence;
using Planb.SharedKernel.Abstractions.Clock;

namespace Planb.Academic.Infrastructure.Seeding;

/// <summary>
/// Seed idempotente del catálogo IT: 4 universidades + 18 carreras + 18 planes vigentes.
/// Corre en cada startup en Development (gateado por HostedService) y verifica si los rows
/// ya están antes de insertar (re-ejecutar es seguro, no duplica ni rompe).
///
/// Responsabilidad acotada: mantener los datos mínimos para que un dev fresh pueda registrarse,
/// elegir universidad+carrera y crear un StudentProfile sin invocar APIs externas. La ingesta
/// operativa real (backoffice UI, CSV importer, migraciones de datos curadas) la cubren
/// mecanismos separados.
/// </summary>
public sealed class AcademicSeeder
{
    private readonly AcademicDbContext _db;
    private readonly IDateTimeProvider _clock;
    private readonly ILogger<AcademicSeeder> _logger;

    public AcademicSeeder(
        AcademicDbContext db,
        IDateTimeProvider clock,
        ILogger<AcademicSeeder> logger)
    {
        _db = db;
        _clock = clock;
        _logger = logger;
    }

    public async Task SeedAsync(CancellationToken ct = default)
    {
        var now = _clock.UtcNow;

        await SeedUniversitiesAsync(now, ct);
        await SeedCareersAndPlansAsync(now, ct);

        if (_db.ChangeTracker.HasChanges())
        {
            await _db.SaveChangesAsync(ct);
        }
    }

    private async Task SeedUniversitiesAsync(DateTimeOffset now, CancellationToken ct)
    {
        var existingIds = (await _db.Universities
            .AsNoTracking()
            .Select(u => u.Id)
            .ToListAsync(ct))
            .ToHashSet();

        var inserted = 0;
        foreach (var record in AcademicSeedData.Universities)
        {
            if (existingIds.Contains(record.Id)) continue;

            _db.Universities.Add(University.Hydrate(
                record.Id, record.Name, record.Slug, now));
            inserted++;
        }

        if (inserted > 0)
        {
            _logger.LogInformation(
                "AcademicSeeder: inserted {Count} universities", inserted);
        }
    }

    private async Task SeedCareersAndPlansAsync(DateTimeOffset now, CancellationToken ct)
    {
        var existingCareerIds = (await _db.Careers
            .AsNoTracking()
            .Select(c => c.Id)
            .ToListAsync(ct))
            .ToHashSet();

        var existingPlanIds = (await _db.CareerPlans
            .AsNoTracking()
            .Select(cp => cp.Id)
            .ToListAsync(ct))
            .ToHashSet();

        var careersInserted = 0;
        var plansInserted = 0;

        foreach (var seed in AcademicSeedData.Careers)
        {
            if (!existingCareerIds.Contains(seed.Career.Id))
            {
                _db.Careers.Add(Career.Hydrate(
                    seed.Career.Id,
                    seed.Career.UniversityId,
                    seed.Career.Name,
                    seed.Career.Slug,
                    now));
                careersInserted++;
            }

            if (!existingPlanIds.Contains(seed.Plan.Id))
            {
                _db.CareerPlans.Add(CareerPlan.Hydrate(
                    seed.Plan.Id,
                    seed.Career.Id,
                    seed.Plan.Year,
                    CareerPlanStatus.Active,
                    now));
                plansInserted++;
            }
        }

        if (careersInserted > 0 || plansInserted > 0)
        {
            _logger.LogInformation(
                "AcademicSeeder: inserted {Careers} careers and {Plans} career plans",
                careersInserted, plansInserted);
        }
    }
}
