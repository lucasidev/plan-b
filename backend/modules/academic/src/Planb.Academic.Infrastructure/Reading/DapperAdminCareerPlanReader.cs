using Dapper;
using Planb.Academic.Application.Features.AdminCareerPlans;
using Planb.Academic.Domain.Careers;
using Planb.SharedKernel.Abstractions.Persistence;

namespace Planb.Academic.Infrastructure.Reading;

/// <summary>
/// Dapper implementation del listado admin de planes de estudio de una carrera (US-061). Trae
/// Active + Deprecated (a diferencia de un catálogo que solo muestre el vigente).
/// </summary>
internal sealed class DapperAdminCareerPlanReader : IAdminCareerPlanReader
{
    private readonly IDbConnectionFactory _connections;

    public DapperAdminCareerPlanReader(IDbConnectionFactory connections) =>
        _connections = connections;

    public async Task<IReadOnlyList<AdminCareerPlanListItem>> ListByCareerAsync(
        CareerId careerId, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT
                cp.id          AS Id,
                cp.year        AS Year,
                cp.status      AS Status,
                cp.is_official AS IsOfficial,
                cp.label       AS Label
            FROM academic.career_plans cp
            WHERE cp.career_id = @CareerId
            ORDER BY cp.year DESC;";

        using var db = _connections.Create();
        var rows = await db.QueryAsync<AdminCareerPlanListItem>(
            new CommandDefinition(sql, new { CareerId = careerId.Value }, cancellationToken: ct));
        return rows.ToList();
    }
}
