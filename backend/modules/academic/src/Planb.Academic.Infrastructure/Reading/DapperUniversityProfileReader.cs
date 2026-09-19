using Dapper;
using Planb.Academic.Application.Features.UniversityProfile;
using Planb.SharedKernel.Abstractions.Persistence;

namespace Planb.Academic.Infrastructure.Reading;

internal sealed class DapperUniversityProfileReader(IDbConnectionFactory connections)
    : IUniversityProfileReader
{
    public async Task<UniversityProfileResponse?> GetAsync(
        Guid universityId,
        CancellationToken ct = default)
    {
        const string profileSql = """
            SELECT
                id AS UniversityId,
                name AS Name,
                slug AS Slug,
                website AS WebsiteUrl,
                address AS Address,
                province AS Province,
                locality_id AS LocalityId,
                locality_name AS LocalityName,
                CASE WHEN logo IS NULL THEN NULL ELSE logo_version END AS LogoVersion,
                (
                    SELECT count(*)::int
                    FROM academic.academic_units au
                    WHERE au.university_id = u.id AND au.is_active
                ) AS AcademicUnitCount,
                (
                    SELECT count(*)::int
                    FROM academic.careers c
                    WHERE c.university_id = u.id AND c.is_active
                ) AS CareerCount,
                (
                    SELECT count(*)::int
                    FROM academic.career_plans cp
                    JOIN academic.careers c ON c.id = cp.career_id
                    WHERE c.university_id = u.id AND c.is_active
                ) AS PlanCount
            FROM academic.universities u
            WHERE id = @UniversityId AND is_active;
            """;
        const string unitsSql = """
            SELECT
                au.id AS Id,
                au.name AS Name,
                au.slug AS Slug,
                au.address AS Address,
                au.province AS Province,
                au.locality_id AS LocalityId,
                au.locality_name AS LocalityName,
                (
                    SELECT count(*)::int
                    FROM academic.careers c
                    WHERE c.academic_unit_id = au.id AND c.is_active
                ) AS CareerCount
            FROM academic.academic_units au
            WHERE au.university_id = @UniversityId AND au.is_active
            ORDER BY au.name;
            """;

        using var db = connections.Create();
        var command = new CommandDefinition(
            profileSql,
            new { UniversityId = universityId },
            cancellationToken: ct);
        var row = await db.QuerySingleOrDefaultAsync<ProfileRow>(command);
        if (row is null)
        {
            return null;
        }

        var unitsCommand = new CommandDefinition(
            unitsSql,
            new { UniversityId = universityId },
            cancellationToken: ct);
        var units = (await db.QueryAsync<UniversityProfileUnit>(unitsCommand)).AsList();
        return new UniversityProfileResponse(
            row.UniversityId,
            row.Name,
            row.Slug,
            row.WebsiteUrl,
            row.Address,
            row.Province,
            row.LocalityId,
            row.LocalityName,
            row.LogoVersion,
            row.AcademicUnitCount,
            row.CareerCount,
            row.PlanCount,
            units);
    }

    public async Task<byte[]?> GetLogoAsync(Guid universityId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT logo
            FROM academic.universities
            WHERE id = @UniversityId AND is_active;
            """;
        using var db = connections.Create();
        return await db.QuerySingleOrDefaultAsync<byte[]>(
            new CommandDefinition(sql, new { UniversityId = universityId }, cancellationToken: ct));
    }

    private sealed record ProfileRow(
        Guid UniversityId,
        string Name,
        string Slug,
        string? WebsiteUrl,
        string? Address,
        string? Province,
        string? LocalityId,
        string? LocalityName,
        int? LogoVersion,
        int AcademicUnitCount,
        int CareerCount,
        int PlanCount);
}
