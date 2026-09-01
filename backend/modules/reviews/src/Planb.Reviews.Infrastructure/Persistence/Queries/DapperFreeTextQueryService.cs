using Dapper;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.SharedKernel.Abstractions.Persistence;

namespace Planb.Reviews.Infrastructure.Persistence.Queries;

/// <summary>
/// Dapper read del campo libre para la curaduría (ADR-0084).
///
/// <para>
/// <b>El SELECT no trae <c>account_id</c>.</b> Es la única defensa real: mientras la columna no
/// salga de la consulta, no hay forma de que llegue a la pantalla por descuido de una capa de más
/// arriba. El texto se lee con su contexto (materia, cátedra, período), que es lo que lo hace
/// legible, y ese contexto es el mismo que la ficha publica agregado.
/// </para>
///
/// <para>
/// <b>No sale del schema <c>reviews</c>:</b> devuelve ids del catálogo y los nombres los pide el
/// handler al contrato de academic (ADR-0087).
/// </para>
/// </summary>
internal sealed class DapperFreeTextQueryService : IFreeTextQueryService
{
    private readonly IDbConnectionFactory _connections;

    public DapperFreeTextQueryService(IDbConnectionFactory connections) =>
        _connections = connections;

    public async Task<FreeTextPage> ListAsync(int skip, int take, CancellationToken ct = default)
    {
        // El WHERE es el mismo en las dos consultas y define qué es "un texto para leer": el campo
        // es opcional al reseñar, así que la enorme mayoría de las filas no tiene ninguno.
        const string sql = @"
            SELECT
                r.id         AS ReviewId,
                r.subject_id AS SubjectId,
                r.term_id    AS TermId,
                r.chair_id   AS ChairId,
                r.free_text  AS Text,
                r.created_at AS WrittenAt
            FROM reviews.reviews r
            WHERE r.free_text IS NOT NULL AND btrim(r.free_text) <> ''
            ORDER BY r.created_at DESC, r.id
            OFFSET @Skip LIMIT @Take;

            SELECT count(*)
            FROM reviews.reviews r
            WHERE r.free_text IS NOT NULL AND btrim(r.free_text) <> '';";

        await using var db = _connections.Create();
        await db.OpenAsync(ct);

        await using var multi = await db.QueryMultipleAsync(
            new CommandDefinition(sql, new { Skip = skip, Take = take }, cancellationToken: ct));

        var rows = (await multi.ReadAsync<RawRow>()).AsList();
        var total = await multi.ReadSingleAsync<int>();

        var items = rows
            .Select(r => new FreeTextRow(
                r.ReviewId,
                r.SubjectId,
                r.TermId,
                r.ChairId,
                r.Text,
                new DateTimeOffset(r.WrittenAt, TimeSpan.Zero)))
            .ToList();

        return new FreeTextPage(items, total);
    }

    /// <summary>
    /// Lo que Dapper materializa. Existe porque Dapper matchea el constructor por tipo exacto y la
    /// columna <c>timestamptz</c> le llega como <see cref="DateTime"/>: el record del contrato
    /// expone <see cref="DateTimeOffset"/>, que es lo que el resto del código usa. Mismo intermedio
    /// que <c>DapperMyReviewsQueryService</c>.
    /// </summary>
    private sealed record RawRow(
        Guid ReviewId,
        Guid SubjectId,
        Guid TermId,
        Guid? ChairId,
        string Text,
        DateTime WrittenAt);
}
