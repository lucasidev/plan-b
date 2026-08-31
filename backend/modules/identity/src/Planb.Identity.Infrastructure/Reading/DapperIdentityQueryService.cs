using Dapper;
using Planb.Identity.Application.Contracts;
using Planb.SharedKernel.Abstractions.Persistence;

namespace Planb.Identity.Infrastructure.Reading;

/// <summary>
/// Impl Dapper del contract público <see cref="IIdentityQueryService"/>. Separada del read
/// service interno (<c>DapperIdentityReadService</c>) por dos razones:
///   1. Aislar la superficie cross-BC: si mañana cambia un shape interno, no rompe a
///      Reviews/etc.
///   2. Filtrar columnas: el internal puede leakear cosas que el cross-BC no debe ver, acá se
///      proyecta solo lo necesario.
/// </summary>
internal sealed class DapperIdentityQueryService : IIdentityQueryService
{
    private readonly IDbConnectionFactory _connections;

    public DapperIdentityQueryService(IDbConnectionFactory connections) =>
        _connections = connections;

    public async Task<bool> HasVerifiedTeacherProfileAsync(
        Guid userId, Guid teacherId, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT EXISTS (
                SELECT 1
                FROM identity.teacher_profiles
                WHERE user_id = @UserId
                  AND teacher_id = @TeacherId
                  AND verified_at IS NOT NULL
            );";

        using var db = _connections.Create();
        return await db.ExecuteScalarAsync<bool>(
            new CommandDefinition(
                sql, new { UserId = userId, TeacherId = teacherId }, cancellationToken: ct));
    }
}
