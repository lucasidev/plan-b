using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Planb.Academic.Domain;
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
/// Seed idempotente del catálogo académico: universidades, unidades académicas, carreras, planes
/// vigentes, materias, períodos lectivos, docentes, cátedras y afirmaciones oficiales. Corre en
/// cada startup en Development (gateado por HostedService) y verifica si los rows ya están antes
/// de insertar (re-ejecutar es seguro, no duplica ni rompe).
///
/// <para>
/// "Ya está" se decide por la clave natural que protege el índice único de cada tabla, no por el
/// id del registro: el id del seed se renumera cuando entra un bloque nuevo, así que contra una
/// base ya sembrada el mismo dato reaparece con otro id. Ver <see cref="SeedLedger{TId, TKey}"/>,
/// que es donde vive esa decisión y por qué no se corrige el desencuentro.
/// </para>
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

    /// <summary>
    /// Lo que la base ya tiene de un bloque del seed, por las dos identidades que le ponen freno a
    /// un insert: el id (la PK) y la clave natural (el índice único). Un registro entra solo si las
    /// dos están libres.
    ///
    /// <para>
    /// El id no alcanza como identidad porque el seed lo renumera: cuando se abre un bloque nuevo,
    /// los ids de los que ya estaban se corren, y contra una base sembrada la misma clave natural
    /// reaparece con otro id mientras su id viejo queda en manos de otra clave. Decidir por id
    /// inserta entonces el duplicado que el índice único prohíbe, y saltea en silencio el registro
    /// cuyo id quedó ocupado.
    /// </para>
    ///
    /// <para>
    /// Los dos desencuentros se saltean con un aviso, no se corrigen: el seeder es de solo alta.
    /// Renumerar no es opción porque los ids ya circulan fuera de su tabla (el tramo de un docente
    /// en su cátedra, las reseñas, las fixtures de los tests) y sin FKs que cascadeen (ADR-0017)
    /// esas referencias quedarían apuntando a la nada; pisar el registro tampoco, porque una fila
    /// que ya existe es del backoffice, que es quien la edita. Alinear los ids de una base poblada
    /// es una migración de datos curada, justo lo que este seeder delega.
    /// </para>
    /// </summary>
    private sealed class SeedLedger<TId, TKey>
        where TId : notnull
        where TKey : notnull
    {
        private readonly HashSet<TId> _ids = [];
        private readonly Dictionary<TKey, TId> _idByKey = [];
        private readonly string _entity;
        private readonly ILogger _logger;

        public SeedLedger(string entity, IEnumerable<(TId Id, TKey Key)> existing, ILogger logger)
        {
            _entity = entity;
            _logger = logger;

            foreach (var (id, key) in existing)
            {
                _ids.Add(id);
                _idByKey[key] = id;
            }
        }

        /// <summary>
        /// El id con el que el registro queda en la base: el que ya tenía, o el que este run le
        /// está dando. Devuelve false cuando el registro no está ni va a estar, que es lo que
        /// necesita saber quien cuelga un hijo de él.
        /// </summary>
        public bool TryGetStoredId(TKey naturalKey, out TId id) => _idByKey.TryGetValue(naturalKey, out id!);

        public bool ShouldInsert(TId id, TKey naturalKey)
        {
            if (_idByKey.TryGetValue(naturalKey, out var storedId))
            {
                if (!EqualityComparer<TId>.Default.Equals(storedId, id))
                {
                    _logger.LogWarning(
                        "AcademicSeeder: {Entity} {NaturalKey} ya está en la base con el id {StoredId} " +
                        "y el seed la numera {SeedId}; queda como está. Alinear los ids de una base " +
                        "poblada es una migración de datos.",
                        _entity, naturalKey, storedId, id);
                }

                return false;
            }

            if (_ids.Contains(id))
            {
                _logger.LogWarning(
                    "AcademicSeeder: {Entity} {NaturalKey} no se siembra porque su id {SeedId} ya lo " +
                    "ocupa otro registro. Alinear los ids de una base poblada es una migración de datos.",
                    _entity, naturalKey, id);
                return false;
            }

            _ids.Add(id);
            _idByKey[naturalKey] = id;
            return true;
        }
    }

    private async Task SeedUniversitiesAsync(DateTimeOffset now, CancellationToken ct)
    {
        // ux_universities_slug.
        var ledger = new SeedLedger<UniversityId, string>(
            "universidad",
            (await _db.Universities
                .AsNoTracking()
                .Select(u => new { u.Id, u.Slug })
                .ToListAsync(ct))
                .Select(u => (u.Id, u.Slug)),
            _logger);

        var inserted = 0;
        foreach (var record in AcademicSeedData.Universities)
        {
            if (!ledger.ShouldInsert(record.Id, record.Slug)) continue;

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
        var existing = await _db.AcademicUnits.ToListAsync(ct);

        // ux_academic_units_university_slug.
        var stored = existing.ToDictionary(u => (u.UniversityId, u.Slug));
        var ledger = new SeedLedger<AcademicUnitId, (UniversityId, string)>(
            "unidad académica",
            existing.Select(u => (u.Id, (u.UniversityId, u.Slug))),
            _logger);

        var inserted = 0;
        var pendingLocality = new List<AcademicUnit>();
        foreach (var record in AcademicSeedData.AcademicUnits)
        {
            var key = (record.UniversityId, record.Slug);

            if (!ledger.ShouldInsert(record.Id, key))
            {
                // La unidad que ya estaba reintenta Georef igual, con el id que tenga en la base.
                if (stored.TryGetValue(key, out var storedUnit) && storedUnit.LocalityId is null)
                {
                    pendingLocality.Add(storedUnit);
                }

                continue;
            }

            var unit = AcademicUnit.Hydrate(
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

    /// <summary>
    /// Carreras y sus planes. El otro índice único de careers, ux_careers_university_code, es
    /// parcial (<c>WHERE code IS NOT NULL</c>) y el seed entra siempre con <c>code: null</c>, así
    /// que no hay clave natural que chequear por ese lado.
    /// </summary>
    private async Task SeedCareersAndPlansAsync(DateTimeOffset now, CancellationToken ct)
    {
        // ux_careers_university_slug.
        var careerLedger = new SeedLedger<CareerId, (UniversityId, string)>(
            "carrera",
            (await _db.Careers
                .AsNoTracking()
                .Select(c => new { c.Id, c.UniversityId, c.Slug })
                .ToListAsync(ct))
                .Select(c => (c.Id, (c.UniversityId, c.Slug))),
            _logger);

        // ux_career_plans_career_year.
        var planLedger = new SeedLedger<CareerPlanId, (CareerId, int)>(
            "plan de estudios",
            (await _db.CareerPlans
                .AsNoTracking()
                .Select(cp => new { cp.Id, cp.CareerId, cp.Year })
                .ToListAsync(ct))
                .Select(cp => (cp.Id, (cp.CareerId, cp.Year))),
            _logger);

        var careersInserted = 0;
        var plansInserted = 0;

        foreach (var seed in AcademicSeedData.Careers)
        {
            var careerKey = (seed.Career.UniversityId, seed.Career.Slug);

            if (careerLedger.ShouldInsert(seed.Career.Id, careerKey))
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

            // El plan cuelga del id con el que la carrera queda en la base, que no siempre es el
            // que el seed le asigna. Y si la carrera no quedó, su plan tampoco va: colgaría de una
            // carrera inexistente.
            if (!careerLedger.TryGetStoredId(careerKey, out var careerId)) continue;

            if (!planLedger.ShouldInsert(seed.Plan.Id, (careerId, seed.Plan.Year))) continue;

            _db.CareerPlans.Add(CareerPlan.Hydrate(
                seed.Plan.Id,
                careerId,
                seed.Plan.Year,
                CareerPlanStatus.Active,
                isOfficial: true,
                label: seed.Plan.Label,
                createdAt: now,
                updatedAt: now));
            plansInserted++;
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
        // ux_subjects_plan_code.
        var ledger = new SeedLedger<SubjectId, (CareerPlanId, string)>(
            "materia",
            (await _db.Subjects
                .AsNoTracking()
                .Select(s => new { s.Id, s.CareerPlanId, s.Code })
                .ToListAsync(ct))
                .Select(s => (s.Id, (s.CareerPlanId, s.Code))),
            _logger);

        var inserted = 0;
        foreach (var record in AcademicSeedData.Subjects)
        {
            if (!ledger.ShouldInsert(record.Id, (record.CareerPlanId, record.Code))) continue;

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
    /// duplicaría cada pareja contra el UNIQUE compuesto. Sin id que renumerar, no hay nada que
    /// llevarle al <see cref="SeedLedger{TId, TKey}"/>: acá la clave natural es la PK.
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
        // ux_academic_terms_uni_year_number_kind.
        var ledger = new SeedLedger<AcademicTermId, (UniversityId, int, int, TermKind)>(
            "período lectivo",
            (await _db.AcademicTerms
                .AsNoTracking()
                .Select(t => new { t.Id, t.UniversityId, t.Year, t.Number, t.Kind })
                .ToListAsync(ct))
                .Select(t => (t.Id, (t.UniversityId, t.Year, t.Number, t.Kind))),
            _logger);

        var inserted = 0;
        foreach (var record in AcademicSeedData.AcademicTerms)
        {
            var key = (record.UniversityId, record.Year, record.Number, record.Kind);
            if (!ledger.ShouldInsert(record.Id, key)) continue;

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

    /// <summary>
    /// Docentes. El único freno que la base le pone a un insert de teachers es la PK: no hay
    /// índice único sobre el nombre, porque dos docentes distintos pueden llamarse igual. Sin
    /// clave natural que chequear, el id es toda la idempotencia que hay.
    /// </summary>
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
        // ux_chairs_subject_name.
        var ledger = new SeedLedger<ChairId, (SubjectId, string)>(
            "cátedra",
            (await _db.Chairs
                .AsNoTracking()
                .Select(c => new { c.Id, c.SubjectId, c.Name })
                .ToListAsync(ct))
                .Select(c => (c.Id, (c.SubjectId, c.Name))),
            _logger);

        var inserted = 0;
        foreach (var record in AcademicSeedData.Chairs)
        {
            if (!ledger.ShouldInsert(record.Id, (record.SubjectId, record.Name))) continue;

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
    /// pueden convivir ahí a propósito (K04). Sin índice único que proteja esa tripla, no hay clave
    /// natural que chequear.
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
