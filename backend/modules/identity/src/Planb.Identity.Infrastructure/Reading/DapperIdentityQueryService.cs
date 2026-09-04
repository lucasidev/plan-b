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

    public async Task<IReadOnlyDictionary<Guid, string>> GetEmailsAsync(
        IReadOnlyCollection<Guid> userIds, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(userIds);

        if (userIds.Count == 0)
        {
            return new Dictionary<Guid, string>();
        }

        const string sql = @"
            SELECT id AS Id, email AS Email
            FROM identity.users
            WHERE id = ANY(@Ids);";

        using var db = _connections.Create();
        var rows = await db.QueryAsync<EmailRow>(
            new CommandDefinition(sql, new { Ids = userIds.ToArray() }, cancellationToken: ct));

        return rows.ToDictionary(r => r.Id, r => r.Email);
    }

    private sealed record EmailRow(Guid Id, string Email);
}
