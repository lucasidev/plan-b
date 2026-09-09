using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Planb.Academic.Domain.AcademicTerms;
using Planb.Academic.Domain.AcademicUnits;
using Planb.Academic.Domain.CareerPlans;
using Planb.Academic.Domain.Careers;
using Planb.Academic.Domain.Chairs;
using Planb.Academic.Domain.OfficialFacts;
using Planb.Academic.Domain.Prerequisites;
using Planb.Academic.Domain.Subjects;
using Planb.Academic.Domain.Teachers;
using Planb.Academic.Domain.Universities;
using Planb.Academic.Infrastructure.Georef;
using Planb.Academic.Infrastructure.Persistence;
using Planb.SharedKernel.Abstractions.Clock;

namespace Planb.Academic.Infrastructure.Seeding;

/// <summary>
/// Seed idempotente del catálogo académico: universidades, carreras, planes vigentes, materias,
/// períodos lectivos y docentes. Corre en cada startup en Development (gateado por HostedService)
/// y verifica si los rows ya están antes de insertar (re-ejecutar es seguro, no duplica ni rompe).
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
    private readonly IGeorefLocalityResolver _georef;
    private readonly ILogger<AcademicSeeder> _logger;

    public AcademicSeeder(
        AcademicDbContext db,
        IDateTimeProvider clock,
        IGeorefLocalityResolver georef,
        ILogger<AcademicSeeder> logger)
    {
        _db = db;
        _clock = clock;
        _georef = georef;
        _logger = logger;
    }

    public async Task SeedAsync(CancellationToken ct = default)
    {
        var now = _clock.UtcNow;

        await SeedUniversitiesAsync(now, ct);
        await SeedAcademicUnitsAsync(now, ct);
        await SeedCareersAndPlansAsync(now, ct);
        await SeedSubjectsAsync(now, ct);
        await SeedPrerequisitesAsync(now, ct);
        await SeedAcademicTermsAsync(now, ct);
        await SeedTeachersAsync(now, ct);
        await SeedChairsAsync(now, ct);
        await SeedOfficialFactsAsync(now, ct);

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
                record.Id, record.Name, record.Slug, record.InstitutionalEmailDomains,
                isActive: true, createdAt: now, updatedAt: now));
            inserted++;
        }

        if (inserted > 0)
        {
            _logger.LogInformation(
                "AcademicSeeder: inserted {Count} universities", inserted);
        }
    }

    /// <summary>
    /// Siembra las AcademicUnits (R6, tarea 19) y resuelve su localidad contra Georef. Carga los
    /// rows tracked (no <c>AsNoTracking</c>, a diferencia del resto de los Seed*Async): una unidad
    /// ya sembrada en un run anterior pero sin localidad (Georef estaba caído esa vez) tiene que
    /// poder reintentar la resolución en este run, no solo las nuevas.
    /// </summary>
    private async Task SeedAcademicUnitsAsync(DateTimeOffset now, CancellationToken ct)
    {
        var existing = await _db.AcademicUnits.ToDictionaryAsync(u => u.Id, ct);

        var inserted = 0;
        var pendingLocality = new List<AcademicUnit>();
        foreach (var record in AcademicSeedData.AcademicUnits)
        {
            if (existing.TryGetValue(record.Id, out var unit))
            {
                if (unit.LocalityId is null)
                {
                    pendingLocality.Add(unit);
                }
                continue;
            }

            unit = AcademicUnit.Hydrate(
                record.Id, record.UniversityId, record.Name, record.Slug, record.Address,
                localityId: null, localityName: null, isActive: true, createdAt: now, updatedAt: now);
            _db.AcademicUnits.Add(unit);
            inserted++;
            pendingLocality.Add(unit);
        }

        if (inserted > 0)
        {
            _logger.LogInformation("AcademicSeeder: inserted {Count} academic units", inserted);
        }

        await ResolveLocalitiesAsync(pendingLocality, ct);
    }

    /// <summary>
    /// Resuelve la localidad de cada unidad pendiente, una llamada a Georef por texto de localidad
    /// distinto (nueve en la Guía SIU, no una por unidad): varias unidades comparten domicilio.
    /// Si Georef no responde para un grupo, esas unidades quedan sin localidad y el seed sigue.
    /// </summary>
    private async Task ResolveLocalitiesAsync(IReadOnlyList<AcademicUnit> units, CancellationToken ct)
    {
        if (units.Count == 0) return;

        var byLocalityText = units
            .Select(unit => (Unit: unit, LocalityText: GeorefAddressParsing.ExtractLocality(unit.Address)))
            .Where(x => x.LocalityText is not null)
            .GroupBy(x => x.LocalityText!, x => x.Unit, StringComparer.OrdinalIgnoreCase);

        var resolved = 0;
        foreach (var group in byLocalityText)
        {
            var found = await _georef.ResolveAsync(group.Key, ct);
            if (found is null) continue;

            foreach (var unit in group)
            {
                unit.ResolveLocality(found.Id, found.Name, _clock);
                resolved++;
            }
        }

        if (resolved > 0)
        {
            _logger.LogInformation("AcademicSeeder: resolved {Count} academic unit localities via Georef", resolved);
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
                    shortName: null,
                    code: null,
                    degreeType: seed.Career.DegreeType,
                    durationYears: seed.Career.DurationYears,
                    cadence: null,
                    description: null,
                    isOfficial: true,
                    isActive: true,
                    createdAt: now,
                    updatedAt: now,
                    academicUnitId: seed.Career.AcademicUnitId));
                careersInserted++;
            }

            // Plan nulo: la carrera entra sin plan detallado (R6, el resto de la oferta de la
            // Guía SIU). Nada que sembrar del lado del plan para esa carrera.
            if (seed.Plan is null) continue;

            if (!existingPlanIds.Contains(seed.Plan.Id))
            {
                _db.CareerPlans.Add(CareerPlan.Hydrate(
                    seed.Plan.Id,
                    seed.Career.Id,
                    seed.Plan.Year,
                    CareerPlanStatus.Active,
                    isOfficial: true,
                    label: seed.Plan.Label,
                    createdAt: now,
                    updatedAt: now));
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

    private async Task SeedSubjectsAsync(DateTimeOffset now, CancellationToken ct)
    {
        var existingIds = (await _db.Subjects
            .AsNoTracking()
            .Select(s => s.Id)
            .ToListAsync(ct))
            .ToHashSet();

        var inserted = 0;
        foreach (var record in AcademicSeedData.Subjects)
        {
            if (existingIds.Contains(record.Id)) continue;

            _db.Subjects.Add(Subject.Hydrate(
                record.Id,
                record.CareerPlanId,
                record.Code,
                record.Name,
                record.YearInPlan,
                record.TermInYear,
                record.TermKind,
                record.WeeklyHours,
                record.TotalHours,
                description: null,
                isOfficial: true,
                isActive: true,
                createdAt: now,
                updatedAt: now));
            inserted++;
        }

        if (inserted > 0)
        {
            _logger.LogInformation(
                "AcademicSeeder: inserted {Count} subjects", inserted);
        }
    }

    /// <summary>
    /// Correlativas del plan TUDCS (ADR-0003). Idempotencia por la tripla completa (no hay id
    /// propio, ver el docstring de <see cref="Prerequisite"/>): sin eso, re-ejecutar el seeder
    /// duplicaría cada pareja contra el UNIQUE compuesto.
    /// </summary>
    private async Task SeedPrerequisitesAsync(DateTimeOffset now, CancellationToken ct)
    {
        var existing = (await _db.Prerequisites
            .AsNoTracking()
            .Select(p => new { p.SubjectId, p.RequiredSubjectId, p.Type })
            .ToListAsync(ct))
            .Select(p => (p.SubjectId, p.RequiredSubjectId, p.Type))
            .ToHashSet();

        var inserted = 0;
        foreach (var record in AcademicSeedData.Prerequisites)
        {
            if (existing.Contains((record.SubjectId, record.RequiredSubjectId, record.Type))) continue;

            _db.Prerequisites.Add(Prerequisite.Hydrate(
                record.SubjectId, record.RequiredSubjectId, record.Type, now));
            inserted++;
        }

        if (inserted > 0)
        {
            _logger.LogInformation(
                "AcademicSeeder: inserted {Count} prerequisites", inserted);
        }
    }

    private async Task SeedAcademicTermsAsync(DateTimeOffset now, CancellationToken ct)
    {
        var existingIds = (await _db.AcademicTerms
            .AsNoTracking()
            .Select(t => t.Id)
            .ToListAsync(ct))
            .ToHashSet();

        var inserted = 0;
        foreach (var record in AcademicSeedData.AcademicTerms)
        {
            if (existingIds.Contains(record.Id)) continue;

            _db.AcademicTerms.Add(AcademicTerm.Hydrate(
                record.Id,
                record.UniversityId,
                record.Year,
                record.Number,
                record.Kind,
                record.StartDate,
                record.EndDate,
                record.EnrollmentOpens,
                record.EnrollmentCloses,
                AcademicTerm.ComputeLabel(record.Year, record.Number, record.Kind),
                createdAt: now));
            inserted++;
        }

        if (inserted > 0)
        {
            _logger.LogInformation(
                "AcademicSeeder: inserted {Count} academic terms", inserted);
        }
    }

    private async Task SeedTeachersAsync(DateTimeOffset now, CancellationToken ct)
    {
        var existingIds = (await _db.Teachers
            .AsNoTracking()
            .Select(t => t.Id)
            .ToListAsync(ct))
            .ToHashSet();

        var inserted = 0;
        foreach (var record in AcademicSeedData.Teachers)
        {
            if (existingIds.Contains(record.Id)) continue;

            _db.Teachers.Add(Teacher.Hydrate(
                record.Id,
                record.UniversityId,
                record.FirstName,
                record.LastName,
                record.Title,
                bio: null,
                photoUrl: null,
                isActive: true,
                createdAt: now,
                updatedAt: now));
            inserted++;
        }

        if (inserted > 0)
        {
            _logger.LogInformation("AcademicSeeder: inserted {Count} teachers", inserted);
        }
    }
    private async Task SeedChairsAsync(DateTimeOffset now, CancellationToken ct)
    {
        var existingIds = (await _db.Chairs
            .AsNoTracking()
            .Select(c => c.Id)
            .ToListAsync(ct))
            .ToHashSet();

        var inserted = 0;
        foreach (var record in AcademicSeedData.Chairs)
        {
            if (existingIds.Contains(record.Id)) continue;

            _db.Chairs.Add(Chair.Hydrate(
                record.Id,
                record.SubjectId,
                record.Name,
                record.Members.Select(m => (m.TeacherId, m.Role, m.SinceTermId, (AcademicTermId?)null)),
                isActive: true,
                createdAt: now,
                updatedAt: now));
            inserted++;
        }

        if (inserted > 0)
        {
            _logger.LogInformation("AcademicSeeder: inserted {Count} chairs", inserted);
        }
    }

    /// <summary>
    /// Afirmaciones oficiales relevadas a mano (ADR-0090, R6 tarea 3): un ledger de solo alta, así
    /// que la idempotencia es la misma que el resto del seed, por Id ya asignado en <see
    /// cref="OfficialFactSeedData"/>, no por la tripla (subject, field) porque varias afirmaciones
    /// pueden convivir ahí a propósito (K04).
    /// </summary>
    private async Task SeedOfficialFactsAsync(DateTimeOffset now, CancellationToken ct)
    {
        var existingIds = (await _db.OfficialFacts
            .AsNoTracking()
            .Select(f => f.Id)
            .ToListAsync(ct))
            .ToHashSet();

        var inserted = 0;
        foreach (var record in OfficialFactSeedData.Facts)
        {
            if (existingIds.Contains(record.Id)) continue;

            _db.OfficialFacts.Add(OfficialFact.Hydrate(
                record.Id,
                record.SubjectType,
                record.SubjectId,
                record.Field,
                record.Value,
                record.Unit,
                record.Period,
                record.SourceName,
                record.SourceUrl,
                record.SourceDocument,
                record.SourceRetrievedAt,
                record.Status,
                record.DerivationRuleId,
                record.Note,
                record.RelievedAt,
                OfficialFactSeedData.RelievedBy,
                createdAt: now));
            inserted++;
        }

        if (inserted > 0)
        {
            _logger.LogInformation("AcademicSeeder: inserted {Count} official facts", inserted);
        }
    }
}
