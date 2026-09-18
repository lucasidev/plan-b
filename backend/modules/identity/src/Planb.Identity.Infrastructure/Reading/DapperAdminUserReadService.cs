using Dapper;
using Planb.Identity.Application.Abstractions.Reading;
using Planb.Identity.Application.Features.AdminUsers;
using Planb.SharedKernel.Abstractions.Persistence;

namespace Planb.Identity.Infrastructure.Reading;

internal sealed class DapperAdminUserReadService(IDbConnectionFactory connections) : IAdminUserReadService
{
    public async Task<AdminUserPage> ListAsync(string search, string status, int page, CancellationToken ct)
    {
        const int pageSize = 25;
        // La búsqueda parcial de email se hace en el listado administrativo paginado. Un índice
        // btree de email no resuelve substring; no agregamos otro índice sin medir este uso.
        const string filter = """
            FROM identity.users u
            WHERE u.role = 'member'::identity.user_role
              AND u.deactivated_at IS NULL AND u.expired_at IS NULL
              AND (@Search = '' OR strpos(u.email, @Search) > 0)
              AND (@Status = 'all'
                OR (@Status = 'suspended' AND u.disabled_at IS NOT NULL)
                OR (@Status = 'pending' AND u.disabled_at IS NULL AND u.email_verified_at IS NULL)
                OR (@Status = 'active' AND u.disabled_at IS NULL AND u.email_verified_at IS NOT NULL))
            """;
        const string sql = "SELECT count(*)::int " + filter + "; " + """
            SELECT u.id AS Id, u.email AS Email, u.created_at AS CreatedAt,
                u.email_verified_at AS EmailVerifiedAt, u.disabled_at AS DisabledAt,
                u.disabled_reason AS DisabledReason, sp.display_name AS DisplayName,
                COALESCE(sp.career_id, u.pending_career_id) AS CareerId,
                sp.enrollment_year AS EnrollmentYear
            FROM (
                SELECT u.*
            """ + filter + """
                ORDER BY u.created_at DESC, u.id
                LIMIT @PageSize OFFSET @Offset
            ) u
            LEFT JOIN identity.student_profiles sp ON sp.user_id = u.id AND sp.status = 'Active'
            ORDER BY u.created_at DESC, u.id;
            """;
        using var db = connections.Create();
        using var results = await db.QueryMultipleAsync(new CommandDefinition(sql,
            new { Search = search, Status = status, PageSize = pageSize, Offset = (page - 1) * pageSize },
            cancellationToken: ct));
        var total = await results.ReadSingleAsync<int>();
        var items = (await results.ReadAsync<AdminUserRow>()).AsList();
        return new AdminUserPage(items, total, page, pageSize);
    }

    public async Task<bool> CanAuthenticateAsync(Guid userId, int accessVersion, CancellationToken ct)
    {
        // La versión conserva la revocación de los JWT anteriores después de reactivar.
        const string sql = """
            SELECT EXISTS (SELECT 1 FROM identity.users WHERE id = @Id
                AND access_version = @AccessVersion
                AND disabled_at IS NULL AND deactivated_at IS NULL
                AND expired_at IS NULL AND email_verified_at IS NOT NULL);
            """;
        using var db = connections.Create();
        return await db.ExecuteScalarAsync<bool>(new CommandDefinition(sql,
            new { Id = userId, AccessVersion = accessVersion }, cancellationToken: ct));
    }
}
