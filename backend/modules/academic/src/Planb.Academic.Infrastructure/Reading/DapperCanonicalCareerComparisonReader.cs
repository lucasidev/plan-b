using Dapper;
using Planb.Academic.Application.Features.CanonicalCareerComparison;
using Planb.Academic.Infrastructure.Georef;
using Planb.Academic.Infrastructure.Seeding;
using Planb.SharedKernel.Abstractions.Persistence;

namespace Planb.Academic.Infrastructure.Reading;

/// <summary>
/// Dapper implementation de <see cref="ICanonicalCareerComparisonReader"/> (R6, tarea 5): resuelve
/// el grupo de carrera canónica contra <see cref="CanonicalCareerGroupings"/> (declarado por el
/// equipo, US-195) y trae, en una sola query, la identidad de cada oferta del grupo con su
/// universidad y su unidad académica. Application no referencia Infrastructure, así que este es el
/// único lugar del código que conoce el archivo de agrupamiento fuera del seeder.
/// </summary>
internal sealed class DapperCanonicalCareerComparisonReader : ICanonicalCareerComparisonReader
{
    private readonly IDbConnectionFactory _connections;

    public DapperCanonicalCareerComparisonReader(IDbConnectionFactory connections) =>
        _connections = connections;

    public async Task<CanonicalCareerGroupRows?> GetGroupAsync(Guid careerId, CancellationToken ct = default)
    {
        var group = CanonicalCareerGroupings.All.FirstOrDefault(
            g => g.CareerIds.Any(id => id.Value == careerId));
        var careerIds = group?.CareerIds.Select(id => id.Value).ToArray() ?? [careerId];

        const string sql = @"
            SELECT
                c.id             AS CareerId,
                c.name           AS CareerName,
                u.id             AS UniversityId,
                u.name           AS UniversityName,
                au.name          AS AcademicUnitName,
                au.locality_id   AS LocalityId,
                au.locality_name AS LocalityName,
                au.address       AS Address
            FROM academic.careers c
            JOIN academic.universities u ON u.id = c.university_id
            LEFT JOIN academic.academic_units au ON au.id = c.academic_unit_id
            WHERE c.id = ANY(@CareerIds);";

        using var db = _connections.Create();
        var rows = await db.QueryAsync<RawRow>(
            new CommandDefinition(sql, new { CareerIds = careerIds }, cancellationToken: ct));

        var offerings = rows.Select(ToOfferingRow).ToList();
        return offerings.Count == 0 ? null : new CanonicalCareerGroupRows(group?.Name, offerings);
    }

    private static CanonicalCareerOfferingRow ToOfferingRow(RawRow r) => new()
    {
        CareerId = r.CareerId,
        CareerName = r.CareerName,
        UniversityId = r.UniversityId,
        UniversityName = r.UniversityName,
        AcademicUnitName = r.AcademicUnitName,
        LocalityId = r.LocalityId,
        LocalityName = r.LocalityName,
        // Provincia extraída del domicilio crudo: el fallback de agrupamiento cuando LocalityName
        // no resolvió contra Georef (tarea 19). "Sin domicilio" solo puede pasar si la carrera no
        // tiene AcademicUnit (Career.AcademicUnitId es nullable): agrupa sola, no rompe.
        Province = (r.Address is null ? null : GeorefAddressParsing.ExtractProvince(r.Address))
            ?? r.Address
            ?? "Sin domicilio",
    };

    private sealed record RawRow
    {
        public Guid CareerId { get; init; }
        public string CareerName { get; init; } = string.Empty;
        public Guid UniversityId { get; init; }
        public string UniversityName { get; init; } = string.Empty;
        public string? AcademicUnitName { get; init; }
        public string? LocalityId { get; init; }
        public string? LocalityName { get; init; }
        public string? Address { get; init; }
    }
}
