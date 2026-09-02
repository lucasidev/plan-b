using Dapper;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.SharedKernel.Abstractions.Persistence;

namespace Planb.Reviews.Infrastructure.Persistence.Queries;

/// <summary>
/// Dapper read del catálogo de frases para curarlo (US-198).
///
/// <para>
/// El orden es el del cuestionario vigente y no el alfabético: es en el que se pregunta, y quien
/// cura decide mirando la secuencia real. Las que no están en la versión vigente (las retiradas)
/// van después, por código, para que la sucesora y su antecesora queden cerca.
/// </para>
/// </summary>
internal sealed class DapperItemCatalogQueryService : IItemCatalogQueryService
{
    private readonly IDbConnectionFactory _connections;

    public DapperItemCatalogQueryService(IDbConnectionFactory connections) =>
        _connections = connections;

    public async Task<IReadOnlyList<CatalogItemView>> GetCatalogAsync(CancellationToken ct = default)
    {
        // Dos resultsets y no un JOIN: traer las opciones en la misma fila multiplicaría cada frase
        // por su cantidad de opciones y habría que desduplicar el conteo de respuestas a mano.
        //
        // El conteo sale de una subconsulta correlacionada sobre review_answers y no de un JOIN por
        // la misma razón: la frase sin una sola respuesta tiene que devolver 0, no desaparecer.
        const string sql = @"
            SELECT
                i.id        AS Id,
                i.code      AS Code,
                i.text      AS Text,
                i.help      AS Help,
                i.layer     AS Layer,
                i.subject   AS Subject,
                i.origin    AS Origin,
                i.is_active AS IsActive,
                prev.code   AS SupersedesCode,
                next.code   AS SupersededByCode,
                (SELECT count(*) FROM reviews.review_answers a WHERE a.item_id = i.id)::int
                            AS AnswerCount,
                i.updated_at      AS UpdatedAt,
                i.retired_at      AS RetiredAt,
                i.last_changed_by AS LastChangedBy
            FROM reviews.items i
            LEFT JOIN reviews.items prev ON prev.id = i.supersedes_item_id
            LEFT JOIN reviews.items next ON next.supersedes_item_id = i.id
            LEFT JOIN (
                SELECT ii.item_id, ii.""order""
                FROM reviews.instrument_items ii
                JOIN reviews.instruments ins ON ins.id = ii.instrument_id
                WHERE ins.valid_until IS NULL
            ) offered ON offered.item_id = i.id
            ORDER BY offered.""order"" NULLS LAST, i.code;

            SELECT
                o.item_id AS ItemId,
                o.value   AS Value,
                o.""order"" AS ""Order"",
                o.label   AS Label,
                o.valence AS Valence
            FROM reviews.item_options o
            ORDER BY o.""order"";";

        using var db = _connections.Create();
        using var grid = await db.QueryMultipleAsync(new CommandDefinition(sql, cancellationToken: ct));

        var rows = (await grid.ReadAsync<ItemRow>()).AsList();
        var options = (await grid.ReadAsync<OptionRow>())
            .GroupBy(o => o.ItemId)
            .ToDictionary(
                g => g.Key,
                g => (IReadOnlyList<CatalogOptionView>)g
                    .Select(o => new CatalogOptionView(o.Value, o.Order, o.Label, o.Valence))
                    .ToList());

        return rows
            .Select(r => new CatalogItemView(
                r.Id,
                r.Code,
                r.Text,
                r.Help,
                r.Layer,
                r.Subject,
                r.Origin,
                r.IsActive,
                r.SupersedesCode,
                r.SupersededByCode,
                r.AnswerCount,
                AsOffset(r.UpdatedAt),
                r.RetiredAt is { } retired ? AsOffset(retired) : null,
                r.LastChangedBy,
                options.TryGetValue(r.Id, out var its) ? its : []))
            .ToList();
    }

    /// <summary>
    /// Npgsql devuelve timestamptz como DateTime (Kind=Utc), no como DateTimeOffset: pedirlo
    /// directo en el constructor del record tira InvalidCastException. Se lee crudo y se envuelve.
    /// </summary>
    private static DateTimeOffset AsOffset(DateTime raw) =>
        new(DateTime.SpecifyKind(raw, DateTimeKind.Utc));

    /// <summary>Fila cruda de la frase, con las fechas todavía como DateTime.</summary>
    private sealed record ItemRow(
        Guid Id,
        string Code,
        string Text,
        string? Help,
        string Layer,
        string Subject,
        string Origin,
        bool IsActive,
        string? SupersedesCode,
        string? SupersededByCode,
        int AnswerCount,
        DateTime UpdatedAt,
        DateTime? RetiredAt,
        Guid? LastChangedBy);

    private sealed record OptionRow(Guid ItemId, short Value, short Order, string Label, string Valence);
}
