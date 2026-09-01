using Dapper;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.SharedKernel.Abstractions.Persistence;

namespace Planb.Reviews.Infrastructure.Persistence.Queries;

/// <summary>
/// Dapper read de las notas del equipo de una carrera (ADR-0084). Solo las vigentes, de la más
/// nueva a la más vieja: la ficha las lee de arriba para abajo y la última es la que más importa.
/// </summary>
internal sealed class DapperEditorialNoteQueryService : IEditorialNoteQueryService
{
    private readonly IDbConnectionFactory _connections;

    public DapperEditorialNoteQueryService(IDbConnectionFactory connections) =>
        _connections = connections;

    public async Task<IReadOnlyList<EditorialNoteRow>> ListForCareerAsync(
        Guid careerId, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT
                n.id           AS Id,
                n.text         AS Text,
                n.published_at AS PublishedAt
            FROM reviews.editorial_notes n
            WHERE n.career_id = @CareerId AND n.withdrawn_at IS NULL
            ORDER BY n.published_at DESC;";

        await using var db = _connections.Create();
        await db.OpenAsync(ct);

        var rows = await db.QueryAsync<RawRow>(
            new CommandDefinition(sql, new { CareerId = careerId }, cancellationToken: ct));

        return rows
            .Select(r => new EditorialNoteRow(r.Id, r.Text, new DateTimeOffset(r.PublishedAt, TimeSpan.Zero)))
            .ToList();
    }

    /// <summary>
    /// Lo que Dapper materializa: matchea el constructor por tipo exacto y <c>timestamptz</c> le
    /// llega como <see cref="DateTime"/>. Mismo intermedio que los otros reads del módulo.
    /// </summary>
    private sealed record RawRow(Guid Id, string Text, DateTime PublishedAt);
}
