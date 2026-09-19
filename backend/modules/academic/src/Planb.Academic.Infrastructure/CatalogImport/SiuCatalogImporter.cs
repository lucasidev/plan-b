using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Planb.Academic.Domain;
using Planb.Academic.Domain.AcademicUnits;
using Planb.Academic.Domain.Careers;
using Planb.Academic.Domain.OfficialFacts;
using Planb.Academic.Domain.Universities;
using Planb.Academic.Infrastructure.Georef;
using Planb.Academic.Application.Abstractions.Georef;
using Planb.Academic.Infrastructure.Persistence;
using Planb.SharedKernel.Abstractions.Clock;

namespace Planb.Academic.Infrastructure.CatalogImport;

/// <summary>
/// Carga un snapshot ya capturado de la Guía SIU. Nunca corre durante el arranque ni una siembra:
/// la fuente externa se revisa y el operador decide cuándo ejecutar este verbo.
/// </summary>
public sealed class SiuCatalogImporter
{
    public static readonly Guid SystemRelievedBy = Guid.Parse("00000010-0000-4000-a000-000000000001");
    private const string NotSurveyedNote = "No relevado fuera de la Guía SIU";
    private const string SourceName = "Guía de carreras universitarias (SIU)";
    private static readonly Regex UnsafeSlugCharacters = new("[^a-z0-9]+", RegexOptions.Compiled);

    private readonly AcademicDbContext _db;
    private readonly IGeorefLocalityResolver _georef;
    private readonly IDateTimeProvider _clock;
    private readonly ILogger<SiuCatalogImporter> _logger;

    public SiuCatalogImporter(AcademicDbContext db, IGeorefLocalityResolver georef, IDateTimeProvider clock,
        ILogger<SiuCatalogImporter> logger)
    {
        _db = db;
        _georef = georef;
        _clock = clock;
        _logger = logger;
    }

    public static Guid GetDeterministicCareerId(SiuCatalogOffering offering) =>
        DeterministicGuid("career|" + OfferingKey(offering));

    public async Task<CatalogImportResult> ImportAsync(SiuCatalogSnapshot snapshot, CancellationToken ct = default)
    {
        var validationErrors = SiuCatalogSnapshotValidator.Validate(snapshot);
        if (validationErrors.Count > 0)
            throw new InvalidOperationException("Invalid SIU snapshot: " + string.Join(" ", validationErrors));

        ct.ThrowIfCancellationRequested();
        var pending = new List<string>();
        var tucuman = snapshot.Offerings.Count(o => o.ProvinceCode == "T");
        var offerings = PrepareOfferings(snapshot.Offerings, pending);
        var existingUniversities = await _db.Universities.AsNoTracking().ToListAsync(ct);
        var existingUnits = await _db.AcademicUnits.ToListAsync(ct);
        var existingCareers = await _db.Careers.AsNoTracking().ToListAsync(ct);

        var newUnitResolutions = await ResolveLocalitiesAsync(offerings, existingUniversities, existingUnits, ct);
        var universities = existingUniversities.ToDictionary(u => CanonicalInstitution(u.Name), StringComparer.Ordinal);
        var units = existingUnits.ToLookup(u => (u.UniversityId.Value, Normalize(u.Name), Normalize(u.Address)));
        var createdUnitByKey = new Dictionary<(Guid UniversityId, string Name, string Address), AcademicUnit>();
        var knownUnitIds = existingUnits.Select(u => u.Id).ToHashSet();
        var knownCareerIds = existingCareers.Select(c => c.Id.Value).ToHashSet();
        var careers = existingCareers.Where(c => c.Description?.StartsWith("Tipo de título según Guía SIU:", StringComparison.Ordinal) != true)
            .GroupBy(CareerIdentityKey).ToDictionary(group => group.Key, group => group.ToList(), StringComparer.Ordinal);
        var createdUniversities = 0;
        var createdUnits = 0;
        var createdCareers = 0;
        var createdFacts = 0;

        await using var transaction = await _db.Database.BeginTransactionAsync(ct);
        foreach (var offering in offerings)
        {
            ct.ThrowIfCancellationRequested();
            var institutionKey = CanonicalInstitution(offering.Institution);
            if (!universities.TryGetValue(institutionKey, out var university))
            {
                var slug = StableSlug("university", offering.Institution, University.MaxSlugLength);
                university = University.Hydrate(new UniversityId(DeterministicGuid("university|" + institutionKey)),
                    offering.Institution.Trim(), slug, [], true, _clock.UtcNow, _clock.UtcNow);
                _db.Universities.Add(university);
                universities.Add(institutionKey, university);
                createdUniversities++;
                createdFacts += AddInstitutionTransparencyFacts(university, offering, snapshot);
            }

            var unit = ResolveUnit(offering, university, units, createdUnitByKey, pending);
            if (unit is null)
            {
                pending.Add($"Offering omitted because its academic unit cannot be identified: {offering.Title} ({offering.Institution}).");
                continue;
            }
            unit.SetProvince(offering.Province, _clock);
            if (unit.LocalityId is null && newUnitResolutions.TryGetValue(
                    (university.Id.Value, Normalize(unit.Name), Normalize(unit.Address)), out var retryLocation)
                && retryLocation is not null)
            {
                if (knownUnitIds.Contains(unit.Id)) _db.AcademicUnits.Attach(unit);
                unit.ResolveLocality(retryLocation.Id, retryLocation.Name, _clock);
            }
            if (knownUnitIds.Add(unit.Id))
            {
                _db.AcademicUnits.Add(unit);
                createdUnitByKey[(university.Id.Value, Normalize(unit.Name), Normalize(unit.Address))] = unit;
                createdUnits++;
            }

            var identity = CareerIdentityKey(university.Id, unit.Id, offering);
            if (knownCareerIds.Contains(GetDeterministicCareerId(offering))) continue;
            var matches = careers.GetValueOrDefault(identity, []);
            if (matches.Count > 1)
            {
                pending.Add($"Ambiguous existing offering: {offering.Title} ({offering.Institution}).");
                continue;
            }
            if (matches.Count == 1) continue;

            var career = CreateCareer(offering, university, unit);
            _db.Careers.Add(career);
            knownCareerIds.Add(career.Id.Value);
            createdCareers++;
            createdFacts += AddFacts(career, offering, snapshot);
        }

        await _db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        _logger.LogInformation("SIU catalog import created {Universities} universities, {Units} units, {Careers} offerings and {Facts} facts; {Pending} pending.",
            createdUniversities, createdUnits, createdCareers, createdFacts, pending.Count);
        return new CatalogImportResult(createdUniversities, createdUnits, createdCareers, createdFacts, tucuman, pending);
    }

    private List<SiuCatalogOffering> PrepareOfferings(IReadOnlyList<SiuCatalogOffering> input, List<string> pending)
    {
        var candidates = new List<SiuCatalogOffering>();
        foreach (var offering in input.Where(o => o.ProvinceCode != "T"))
        {
            if (string.IsNullOrWhiteSpace(offering.Institution) || string.IsNullOrWhiteSpace(offering.Title)
                || offering.Institution.Length > University.MaxNameLength || offering.Title.Length > Career.MaxNameLength
                || offering.AcademicUnit?.Length > AcademicUnit.MaxNameLength || offering.Address?.Length > AcademicUnit.MaxAddressLength)
                pending.Add($"Source row exceeds catalog limits or lacks institution/title: {offering.ProvinceCode}|{offering.Level}|{offering.Institution}|{offering.Title}.");
            else candidates.Add(offering);
        }

        return candidates.Where(o => !string.IsNullOrWhiteSpace(o.Institution) && !string.IsNullOrWhiteSpace(o.Title))
            .GroupBy(OfferingKey, StringComparer.Ordinal)
            .SelectMany(group =>
            {
                var duration = group.Select(o => NormalizeOptional(o.Duration)).Distinct(StringComparer.Ordinal).ToList();
                var admission = group.Select(o => NormalizeOptional(o.Admission)).Distinct(StringComparer.Ordinal).ToList();
                if (duration.Count > 1 || admission.Count > 1)
                {
                    pending.Add($"Source rows disagree on duration or admission for {group.Key}.");
                    return Enumerable.Empty<SiuCatalogOffering>();
                }
                return new[] { group.First() };
            }).ToList();
    }

    private async Task<Dictionary<(Guid UniversityId, string Name, string Address), GeorefLocality?>> ResolveLocalitiesAsync(
        IReadOnlyList<SiuCatalogOffering> offerings, IReadOnlyList<University> universities,
        IReadOnlyList<AcademicUnit> units, CancellationToken ct)
    {
        var resolved = new Dictionary<(Guid, string, string), GeorefLocality?>();
        var locations = new Dictionary<(string Locality, string Province), GeorefLocality?>();
        foreach (var offering in offerings.Where(o => !string.IsNullOrWhiteSpace(o.AcademicUnit) && !string.IsNullOrWhiteSpace(o.Address)))
        {
            var university = universities.SingleOrDefault(u => CanonicalInstitution(u.Name) == CanonicalInstitution(offering.Institution));
            var universityId = university?.Id.Value ?? DeterministicGuid("university|" + CanonicalInstitution(offering.Institution));
            var key = (UniversityId: universityId, Name: Normalize(offering.AcademicUnit!), Address: Normalize(offering.Address!));
            if (resolved.ContainsKey(key) || units.Any(u => u.UniversityId.Value == key.UniversityId && Normalize(u.Name) == key.Name && Normalize(u.Address) == key.Address && u.LocalityId is not null)) continue;
            var locality = GeorefAddressParsing.ExtractLocality(offering.Address!);
            var province = GeorefAddressParsing.ExtractProvince(offering.Address!);
            if (locality is null || province is null) { resolved[key] = null; continue; }
            var locationKey = (Normalize(locality), Normalize(province));
            if (!locations.TryGetValue(locationKey, out var location))
            {
                location = await _georef.ResolveAsync(locality, province, ct);
                locations.Add(locationKey, location);
            }
            resolved[key] = location;
        }
        return resolved;
    }

    private AcademicUnit? ResolveUnit(SiuCatalogOffering offering, University university,
        ILookup<(Guid, string, string), AcademicUnit> existing,
        IReadOnlyDictionary<(Guid UniversityId, string Name, string Address), AcademicUnit> created,
        List<string> pending)
    {
        if (string.IsNullOrWhiteSpace(offering.AcademicUnit) || string.IsNullOrWhiteSpace(offering.Address)) return null;
        var key = (university.Id.Value, Normalize(offering.AcademicUnit), Normalize(offering.Address));
        if (created.TryGetValue((key.Item1, key.Item2, key.Item3), out var imported)) return imported;
        var matches = existing[key].ToList();
        if (matches.Count > 1)
        {
            pending.Add($"Ambiguous existing academic unit: {offering.AcademicUnit} ({offering.Institution}).");
            return null;
        }
        if (matches.Count == 1) return matches[0];
        return AcademicUnit.Hydrate(new AcademicUnitId(DeterministicGuid($"unit|{key.Item1}|{key.Item2}|{key.Item3}")), university.Id,
            offering.AcademicUnit.Trim(), StableSlug("unit", $"{key.Item2}|{key.Item3}", AcademicUnit.MaxSlugLength), offering.Address.Trim(),
            null, null, true, _clock.UtcNow, _clock.UtcNow);
    }

    private Career CreateCareer(SiuCatalogOffering offering, University university, AcademicUnit unit)
    {
        var degreeType = MapDegreeType(offering.DegreeType);
        var description = !string.IsNullOrWhiteSpace(offering.DegreeType)
            ? $"Tipo de título según Guía SIU: {offering.DegreeType.Trim()}" : null;
        var match = Regex.Match(offering.Duration?.Trim() ?? "", @"^(\d+)\s+Años?$", RegexOptions.IgnoreCase);
        var duration = match.Success && int.TryParse(match.Groups[1].Value, out var parsed) && parsed is >= 1 and <= 15 ? parsed : (int?)null;
        return Career.Hydrate(new CareerId(GetDeterministicCareerId(offering)), university.Id, offering.Title.Trim(),
            StableSlug("career", OfferingKey(offering), Career.MaxSlugLength), null, null, degreeType, duration, null, description,
            true, true, _clock.UtcNow, _clock.UtcNow, unit.Id);
    }

    private static string CareerIdentityKey(Career career) => string.Join('|', career.UniversityId.Value,
        career.AcademicUnitId?.Value, Normalize(career.Name), career.DegreeType?.ToString());

    private static string CareerIdentityKey(UniversityId universityId, AcademicUnitId unitId, SiuCatalogOffering offering)
    {
        var degreeType = MapDegreeType(offering.DegreeType);
        return string.Join('|', universityId.Value, unitId.Value, Normalize(offering.Title), degreeType?.ToString());
    }

    private int AddFacts(Career career, SiuCatalogOffering offering, SiuCatalogSnapshot snapshot)
    {
        var coverage = snapshot.Coverage.Single(c => c.ProvinceCode == offering.ProvinceCode && c.Level == offering.Level);
        var values = new[]
        {
            (OfficialFactField.PaperDuration, OfficialFactStatus.Published, NormalizeOptional(offering.Duration), durationUnit: (string?)null),
            (OfficialFactField.AdmissionRegime, OfficialFactStatus.Published, NormalizeOptional(offering.Admission), durationUnit: (string?)null),
            (OfficialFactField.AcademicUnit, OfficialFactStatus.Published, NormalizeOptional(offering.AcademicUnit), durationUnit: (string?)null),
            (OfficialFactField.RealDuration, OfficialFactStatus.NotPublished, (string?)null, durationUnit: (string?)null),
            (OfficialFactField.CohortGraduation, OfficialFactStatus.NotPublished, (string?)null, durationUnit: (string?)null),
            (OfficialFactField.CurrentPlan, OfficialFactStatus.NotPublished, (string?)null, durationUnit: (string?)null),
            (OfficialFactField.Accreditation, OfficialFactStatus.NotPublished, (string?)null, durationUnit: (string?)null),
            (OfficialFactField.NationalValidity, OfficialFactStatus.NotPublished, (string?)null, durationUnit: (string?)null),
        };
        var count = 0;
        foreach (var (field, status, value, durationUnit) in values)
        {
            var actualStatus = status == OfficialFactStatus.Published && value is null ? OfficialFactStatus.NotPublished : status;
            var fact = OfficialFact.Create(OfficialFactSubjectType.Offering, career.Id.Value, field, actualStatus, value, durationUnit,
                null, SourceName, coverage.Url, null, snapshot.RetrievedAt, null,
                actualStatus == OfficialFactStatus.NotPublished ? NotSurveyedNote : null, _clock.UtcNow, SystemRelievedBy, _clock);
            if (fact.IsFailure) throw new InvalidDataException($"Invalid SIU fact: {fact.Error}");
            _db.OfficialFacts.Add(fact.Value); count++;
        }
        return count;
    }

    private int AddInstitutionTransparencyFacts(University university, SiuCatalogOffering offering, SiuCatalogSnapshot snapshot)
    {
        var coverage = snapshot.Coverage.Single(c => c.ProvinceCode == offering.ProvinceCode && c.Level == offering.Level);
        var fields = new[]
        {
            OfficialFactField.MinutesPublished,
            OfficialFactField.BudgetPublished,
            OfficialFactField.StaffRosterPublished,
            OfficialFactField.InterimShare,
            OfficialFactField.InstitutionalEvaluation,
        };
        foreach (var field in fields)
        {
            var fact = OfficialFact.Create(OfficialFactSubjectType.Institution, university.Id.Value, field,
                OfficialFactStatus.NotPublished, null, null, null, SourceName, coverage.Url, null,
                snapshot.RetrievedAt, null, NotSurveyedNote, _clock.UtcNow, SystemRelievedBy, _clock);
            if (fact.IsFailure) throw new InvalidDataException($"Invalid SIU fact: {fact.Error}");
            _db.OfficialFacts.Add(fact.Value);
        }
        return fields.Length;
    }

    private static CareerDegreeType? MapDegreeType(string? value) => value?.Trim() switch
    {
        "Grado" => CareerDegreeType.Grado,
        "Doctorado" or "Especialización" or "Maestría" or "Otros Posgrados" or "Postítulo" => CareerDegreeType.Posgrado,
        _ => null,
    };

    private static string OfferingKey(SiuCatalogOffering offering) => string.Join('|', CanonicalInstitution(offering.Institution),
        Normalize(offering.AcademicUnit), Normalize(offering.Address), Normalize(offering.Title), Normalize(offering.DegreeType));

    private static string CanonicalInstitution(string value) => Normalize(value) switch
    {
        "unsta" => "universidad-del-norte-santo-tomas-de-aquino",
        "unt" => "universidad-nacional-de-tucuman",
        "uspt" or "universidad-de-san-pablo---t" => "universidad-de-san-pablo-t",
        "unse" => "universidad-nacional-de-santiago-del-estero",
        "utn" => "universidad-tecnologica-nacional",
        var normalized => normalized,
    };

    private static string Normalize(string? value) => SlugCanonicalizer.Canonicalize(value ?? string.Empty);
    private static string? NormalizeOptional(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static string StableSlug(string kind, string naturalKey, int maxLength)
    {
        var stem = UnsafeSlugCharacters.Replace(SlugCanonicalizer.Canonicalize(naturalKey), "-").Trim('-');
        var suffix = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(kind + "|" + naturalKey))).ToLowerInvariant()[..10];
        return $"{stem[..Math.Min(stem.Length, maxLength - suffix.Length - 1)]}-{suffix}";
    }

    private static Guid DeterministicGuid(string key)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(key))[..16];
        bytes[6] = (byte)((bytes[6] & 0x0f) | 0x50);
        bytes[8] = (byte)((bytes[8] & 0x3f) | 0x80);
        return new Guid(bytes);
    }
}
