using Dapper;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.SharedKernel.Abstractions.Persistence;

namespace Planb.Reviews.Infrastructure.Persistence.Queries;

/// <summary>
/// Dapper read de las reseñas de una cuenta (US-165, US-166): lo que aportó, para poder corregirlo
/// o borrarlo.
///
/// <para>
/// Filtra por <c>account_id</c> y ese parámetro sale del token, nunca del pedido: es el único read
/// del producto que devuelve reseñas de a una, así que quién puede pedirlo es la garantía entera.
/// </para>
///
/// <para>
/// <b>No sale del schema <c>reviews</c>:</b> devuelve ids del catálogo, no nombres. Los nombres los
/// pide <c>GetMyReviewsQueryHandler</c> al contrato de academic, en una sola llamada con
/// todos los ids. Leerlos de sus tablas ataría este read a un esquema ajeno que ningún compilador
/// chequea.
/// </para>
/// </summary>
internal sealed class DapperMyReviewsQueryService : IMyReviewsQueryService
{
    private readonly IDbConnectionFactory _connections;

    public DapperMyReviewsQueryService(IDbConnectionFactory connections) =>
        _connections = connections;

    public async Task<IReadOnlyList<MyReviewRow>> ListAsync(
        Guid accountId, CancellationToken ct = default)
    {
        // `chair_id` es nullable porque declarar la cátedra es opcional: "no me acuerdo" es una
        // respuesta válida al reseñar, y esa reseña sigue siendo suya y editable.
        const string sql = @"
            SELECT
                r.id          AS Id,
                r.subject_id  AS SubjectId,
                r.term_id     AS TermId,
                r.chair_id    AS ChairId,
                r.free_text   AS FreeText,
                r.created_at  AS CreatedAt,
                r.updated_at  AS UpdatedAt
            FROM reviews.reviews r
            WHERE r.account_id = @AccountId
            ORDER BY r.created_at DESC;

            SELECT
                a.review_id AS ReviewId,
                i.code             AS ItemCode,
                a.option_value     AS OptionValue
            FROM reviews.review_answers a
            JOIN reviews.items i ON i.id = a.item_id
            WHERE a.review_id IN (
                SELECT id FROM reviews.reviews WHERE account_id = @AccountId)
            ORDER BY i.code;";

        using var db = _connections.Create();
        using var grid = await db.QueryMultipleAsync(
            new CommandDefinition(sql, new { AccountId = accountId }, cancellationToken: ct));

        var rows = (await grid.ReadAsync<RawRow>()).AsList();
        var answersByReview = (await grid.ReadAsync<MyAnswerRow>())
            .GroupBy(a => a.ReviewId)
            .ToDictionary(
                g => g.Key,
                g => (IReadOnlyList<MyAnswerView>)g
                    .Select(a => new MyAnswerView(a.ItemCode, a.OptionValue))
                    .ToList());

        return rows
            .Select(r => new MyReviewRow(
                r.Id,
                r.SubjectId,
                r.TermId,
                r.ChairId,
                answersByReview.TryGetValue(r.Id, out var answers) ? answers : [],
                r.FreeText,
                AsOffset(r.CreatedAt),
                AsOffset(r.UpdatedAt)))
            .ToList();
    }

    /// <summary>
    /// Npgsql devuelve timestamptz como DateTime (Kind=Utc), no como DateTimeOffset: mapearlo
    /// directo al record tira InvalidCastException.
    /// </summary>
    private static DateTimeOffset AsOffset(DateTime raw) =>
        new(DateTime.SpecifyKind(raw, DateTimeKind.Utc));

    private sealed record RawRow(
        Guid Id,
        Guid SubjectId,
        Guid TermId,
        Guid? ChairId,
        string? FreeText,
        DateTime CreatedAt,
        DateTime UpdatedAt);

    private sealed record MyAnswerRow(Guid ReviewId, string ItemCode, short OptionValue);
}
