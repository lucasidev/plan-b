using System.Data;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Planb.Identity.Application.Abstractions.Reading;
using Planb.Identity.Domain.Users;

namespace Planb.Identity.Infrastructure.Reading;

/// <summary>
/// Dapper-backed read service para Identity (ADR-0018: writes via EF + repositorios, reads
/// complejos via Dapper que devuelven primitivos / DTOs planos sin pasar por aggregate).
///
/// Hoy expone una sola query (US-022). La abstracción acepta más reads complejos (user
/// listings con filtros, audit queries, etc.) sin acoplarse a EF.
/// </summary>
internal sealed class DapperIdentityReadService : IIdentityReadService
{
    private readonly string _connectionString;

    public DapperIdentityReadService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Planb")
            ?? throw new InvalidOperationException(
                "ConnectionStrings:Planb is required for DapperIdentityReadService.");
    }

    public async Task<IReadOnlyList<UserId>> GetUnverifiedExpirationCandidatesAsync(
        DateTimeOffset cutoff,
        CancellationToken ct = default)
    {
        // Cualquier user creado antes del cutoff que aún no se verificó, no está disabled y no
        // está expirado todavía. El partial unique index en email garantiza que como mucho hay
        // un activo por email; si Lucia se registró 2 veces, la primera ya está expired y este
        // query la ignora correctamente.
        const string sql = @"
            SELECT id
            FROM identity.users
            WHERE email_verified_at IS NULL
              AND disabled_at IS NULL
              AND expired_at IS NULL
              AND created_at <= @Cutoff;";

        using IDbConnection db = new NpgsqlConnection(_connectionString);
        var ids = await db.QueryAsync<Guid>(
            new CommandDefinition(sql, new { Cutoff = cutoff }, cancellationToken: ct));

        return ids.Select(id => new UserId(id)).ToList();
    }
}
