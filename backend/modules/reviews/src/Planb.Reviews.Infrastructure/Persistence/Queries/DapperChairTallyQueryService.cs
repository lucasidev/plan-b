using Dapper;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Domain.Catalog;
using Planb.Reviews.Domain.Reviews;
using Planb.Reviews.Domain.Publishing;
using Planb.SharedKernel.Abstractions.Persistence;

namespace Planb.Reviews.Infrastructure.Persistence.Queries;

/// <summary>
/// Dapper read de los conteos de una cátedra (US-147, ADR-0083). Cuenta y no decide: qué de esto
/// llega a la pantalla lo resuelve <see cref="ChairFactsCalculator"/>.
///
/// <para>
/// Dos invariantes del modelo se cumplen acá y conviene tenerlas a la vista:
/// </para>
/// <list type="number">
///   <item>
///     El recorrido arranca en <c>item_options</c> y no en las respuestas: cada opción trae su
///     conteo aunque nadie la haya elegido, porque la ficha publica la distribución **completa** y
///     un cero es información ("nadie eligió 'siempre'"), no una fila ausente.
///   </item>
///   <item>
///     El denominador de cada frase son sus propias respuestas, no las reseñas de la cátedra. Lo
///     salteado no deja fila (ADR-0082), así que dos frases de la misma cátedra pueden tener
///     denominadores distintos y eso es correcto, no un bug de la query.
///   </item>
///   <item>
///     Los conteos de la cátedra traen también las frases <b>retiradas</b> (US-198): son el tramo de
///     antes de la que las reemplazó, y filtrarlas haría desaparecer de la ficha lo que se respondió
///     bajo el código viejo. Las de las hermanas no: contra ellas se compara, y un tramo viejo no se
///     compara con nada. Que una retirada sin respuestas no aparezca lo resuelve el calculador, que
///     descarta todo lo que tiene total cero.
///   </item>
/// </list>
/// </summary>
internal sealed class DapperChairTallyQueryService : IChairTallyQueryService
{
    private readonly IDbConnectionFactory _connections;

    public DapperChairTallyQueryService(IDbConnectionFactory connections) =>
        _connections = connections;

    public async Task<ChairTallies> GetTalliesAsync(
        Guid chairId,
        IReadOnlyList<Guid> siblingChairIds,
        CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(siblingChairIds);

        // Un solo viaje con tres resultsets: el conteo de reseñas (que decide el piso), los conteos
        // de la cátedra y los de sus hermanas. Van juntos porque la ficha los necesita a los tres
        // para dibujar una sola pantalla, y separarlos serían tres round-trips para lo mismo.
        //
        // El CROSS JOIN de opciones contra el filtro de reseñas es lo que hace que una opción sin
        // elegir devuelva 0 en vez de desaparecer: se cuenta con FILTER sobre el LEFT JOIN, no con
        // un WHERE que las borraría.
        const string sql = @"
            SELECT count(*)::int
            FROM reviews.reviews
            WHERE chair_id = @ChairId;

            SELECT
                i.code    AS ItemCode,
                i.layer   AS Layer,
                NOT i.is_active AS IsRetired,
                prev.code AS SupersedesCode,
                i.retired_at AS RetiredAt,
                o.value   AS Value,
                o.""order"" AS ""Order"",
                o.label   AS Label,
                o.valence AS Valence,
                count(a.review_id)::int AS Count
            FROM reviews.items i
            LEFT JOIN reviews.items prev ON prev.id = i.supersedes_item_id
            JOIN reviews.item_options o ON o.item_id = i.id
            LEFT JOIN reviews.review_answers a
                ON a.item_id = i.id
               AND a.option_value = o.value
               AND a.review_id IN (
                   SELECT id FROM reviews.reviews WHERE chair_id = @ChairId)
            GROUP BY i.code, i.layer, i.is_active, prev.code, i.retired_at,
                     o.value, o.""order"", o.label, o.valence
            ORDER BY i.code, o.""order"";

            SELECT
                i.code    AS ItemCode,
                i.layer   AS Layer,
                false     AS IsRetired,
                NULL::text        AS SupersedesCode,
                NULL::timestamptz AS RetiredAt,
                o.value   AS Value,
                o.""order"" AS ""Order"",
                o.label   AS Label,
                o.valence AS Valence,
                count(a.review_id)::int AS Count
            FROM reviews.items i
            JOIN reviews.item_options o ON o.item_id = i.id
            LEFT JOIN reviews.review_answers a
                ON a.item_id = i.id
               AND a.option_value = o.value
               AND a.review_id IN (
                   SELECT id FROM reviews.reviews WHERE chair_id = ANY(@SiblingIds))
            WHERE i.is_active = true
            GROUP BY i.code, i.layer, o.value, o.""order"", o.label, o.valence
            ORDER BY i.code, o.""order"";

            SELECT i.code AS Code, i.text AS Text
            FROM reviews.items i;

            SELECT DISTINCT term_id
            FROM reviews.reviews
            WHERE chair_id = @ChairId;

            SELECT max(created_at)
            FROM reviews.reviews
            WHERE chair_id = @ChairId;";

        using var db = _connections.Create();
        using var grid = await db.QueryMultipleAsync(new CommandDefinition(
            sql,
            new { ChairId = chairId, SiblingIds = siblingChairIds.ToArray() },
            cancellationToken: ct));

        var reviewCount = await grid.ReadSingleAsync<int>();
        var here = ToTallies(await grid.ReadAsync<TallyRow>());
        var siblingRows = ToTallies(await grid.ReadAsync<TallyRow>());
        var texts = (await grid.ReadAsync<ItemTextRow>())
            .ToDictionary(r => r.Code, r => r.Text, StringComparer.Ordinal);
        var termIds = (await grid.ReadAsync<Guid>()).AsList();

        // Npgsql devuelve timestamptz como DateTime (Kind=Utc), no como DateTimeOffset: pedirlo
        // directo tira InvalidCastException. Se lee crudo y se envuelve acá.
        var lastReviewedRaw = await grid.ReadSingleOrDefaultAsync<DateTime?>();
        var lastReviewedAt = lastReviewedRaw is { } raw
            ? new DateTimeOffset(DateTime.SpecifyKind(raw, DateTimeKind.Utc))
            : (DateTimeOffset?)null;

        // Sin hermanas la query de hermanas devuelve todo en cero; se descarta entera en vez de
        // pasarle ceros al calculador, que los leería como "las hermanas están impecables". El
        // resultset se consume igual: dejarlo sin leer desalinea los que vienen después.
        var siblings = siblingChairIds.Count == 0 ? [] : siblingRows;

        return new ChairTallies(
            reviewCount, here, siblings, Completion(here), texts, termIds, lastReviewedAt);
    }

    /// <summary>
    /// Agrupa las filas planas en un <see cref="ItemTally"/> por frase. El orden de las opciones
    /// viene del SQL y se respeta: es el orden en que se ofrecieron al responder, y la ficha dibuja
    /// la distribución en ese mismo orden.
    /// </summary>
    public async Task<Guid?> PickPublishingChairAsync(
        int minimumReviews, CancellationToken ct = default)
    {
        // `random()` y no un orden estable: el sorteo tiene que ser sorteo. Con `HAVING` sobre el
        // conteo se descartan las que todavía no cruzaron el piso, que es el mismo piso que la
        // ficha usa para decidir si publica; una cátedra que no publica no tendría nada que mostrar.
        const string sql = @"
            SELECT chair_id
            FROM reviews.reviews
            WHERE chair_id IS NOT NULL
            GROUP BY chair_id
            HAVING count(*) >= @MinimumReviews
            ORDER BY random()
            LIMIT 1;";

        using var db = _connections.Create();
        return await db.QuerySingleOrDefaultAsync<Guid?>(
            new CommandDefinition(sql, new { MinimumReviews = minimumReviews }, cancellationToken: ct));
    }

    private static List<ItemTally> ToTallies(IEnumerable<TallyRow> rows) =>
        rows
            .GroupBy(r => r.ItemCode, StringComparer.Ordinal)
            .Select(g => new ItemTally(
                g.Key,
                Enum.Parse<ItemLayer>(g.First().Layer),
                g.Select(r => new OptionTally(
                        r.Value,
                        r.Order,
                        r.Label,
                        Enum.Parse<OptionValence>(r.Valence),
                        r.Count))
                    .ToList(),
                g.First().IsRetired,
                g.First().SupersedesCode,
                AsOffset(g.First().RetiredAt)))
            .ToList();

    /// <summary>
    /// La tasa de finalización sale del mismo conteo del desenlace que ya vino, sin otra query: es
    /// una lectura distinta de las mismas filas. Si nadie contestó esa frase, no hay tasa (null), que
    /// no es lo mismo que una tasa de cero (ADR-0054).
    /// </summary>
    private static (int Reaching, int Total)? Completion(IReadOnlyList<ItemTally> tallies)
    {
        var outcome = tallies.FirstOrDefault(t =>
            string.Equals(t.ItemCode, PublishingRules.OutcomeItemCode, StringComparison.Ordinal));

        if (outcome is null || outcome.Total == 0)
        {
            return null;
        }

        var reaching = outcome.Options
            .Where(o => PublishingRules.OutcomeValuesReachingTheEnd.Contains(o.Value))
            .Sum(o => o.Count);

        return (reaching, outcome.Total);
    }

    /// <summary>
    /// Fila plana del SQL, antes de agruparse por frase.
    ///
    /// <para>
    /// <b>El orden de estos parámetros es el de las columnas del SELECT, y no es cosmético</b>:
    /// Dapper matchea la firma del constructor posicionalmente contra las columnas del reader, y si
    /// no encuentra una que coincida tira <c>InvalidOperationException</c> en runtime pidiendo "a
    /// parameterless default constructor or one matching signature". Por eso las dos consultas que
    /// materializan este record devuelven las MISMAS columnas en el MISMO orden, y la de las
    /// hermanas rellena con constantes las tres que no le aplican.
    /// </para>
    /// </summary>
    private sealed record TallyRow(
        string ItemCode,
        string Layer,
        bool IsRetired,
        string? SupersedesCode,
        DateTime? RetiredAt,
        short Value,
        short Order,
        string Label,
        string Valence,
        int Count);

    /// <summary>El texto de una frase, para que la respuesta pueda enunciarlo en castellano.</summary>
    private sealed record ItemTextRow(string Code, string Text);

    public async Task<SubjectTallies> GetPerChairAsync(
        IReadOnlyList<(Guid ChairId, string ChairName)> chairs,
        CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(chairs);
        if (chairs.Count == 0)
        {
            return new SubjectTallies([], [], new Dictionary<string, string>(StringComparer.Ordinal));
        }

        // Los conteos de todas las cátedras en un solo viaje, discriminados por cátedra: la ficha
        // de materia necesita verlas separadas para poder contrastarlas, no sumadas.
        //
        // El recorrido arranca en el producto cartesiano de cátedras por opciones, y las respuestas
        // entran por LEFT JOIN. Es lo que hace que una opción sin elegir devuelva 0 en vez de
        // desaparecer, y que una cátedra sin una sola reseña siga apareciendo en el resultado.
        const string sql = @"
            SELECT
                c.chair_id AS ChairId,
                count(r.id)::int AS ReviewCount,
                max(r.created_at) AS LastReviewedAt
            FROM unnest(@ChairIds) AS c(chair_id)
            LEFT JOIN reviews.reviews r ON r.chair_id = c.chair_id
            GROUP BY c.chair_id;

            SELECT
                c.chair_id AS ChairId,
                i.code     AS ItemCode,
                i.layer    AS Layer,
                o.value    AS Value,
                o.""order""  AS ""Order"",
                o.label    AS Label,
                o.valence  AS Valence,
                count(a.review_id)::int AS Count
            FROM unnest(@ChairIds) AS c(chair_id)
            CROSS JOIN reviews.items i
            JOIN reviews.item_options o ON o.item_id = i.id
            LEFT JOIN reviews.review_answers a
                ON a.item_id = i.id
               AND a.option_value = o.value
               AND a.review_id IN (
                   SELECT id FROM reviews.reviews WHERE chair_id = c.chair_id)
            WHERE i.is_active = true
            GROUP BY c.chair_id, i.code, i.layer, o.value, o.""order"", o.label, o.valence
            ORDER BY c.chair_id, i.code, o.""order"";

            SELECT DISTINCT term_id
            FROM reviews.reviews
            WHERE chair_id = ANY(@ChairIds);

            SELECT i.code AS Code, i.text AS Text
            FROM reviews.items i
            WHERE i.is_active = true;";

        using var db = _connections.Create();
        using var grid = await db.QueryMultipleAsync(new CommandDefinition(
            sql,
            new { ChairIds = chairs.Select(c => c.ChairId).ToArray() },
            cancellationToken: ct));

        var counts = (await grid.ReadAsync<ChairCountRow>())
            .ToDictionary(r => r.ChairId, r => r);
        var tallyRows = (await grid.ReadAsync<ChairTallyRow>())
            .GroupBy(r => r.ChairId)
            .ToDictionary(g => g.Key, g => g.ToList());
        var termIds = (await grid.ReadAsync<Guid>()).AsList();
        var texts = (await grid.ReadAsync<ItemTextRow>())
            .ToDictionary(r => r.Code, r => r.Text, StringComparer.Ordinal);

        // Se recorre la lista pedida y no la que volvió: el orden y la nómina los decide quien
        // pregunta, y una cátedra sin filas tiene que salir igual, con sus conteos en cero.
        var contributions = chairs
            .Select(chair =>
            {
                counts.TryGetValue(chair.ChairId, out var count);
                tallyRows.TryGetValue(chair.ChairId, out var rows);

                return new ChairContribution(
                    chair.ChairId,
                    chair.ChairName,
                    count?.ReviewCount ?? 0,
                    ToTallies((rows ?? []).Select(r => r.ToTallyRow())),
                    AsOffset(count?.LastReviewedAt));
            })
            .ToList();

        return new SubjectTallies(contributions, termIds, texts);
    }

    /// <summary>
    /// Npgsql devuelve timestamptz como DateTime (Kind=Utc), no como DateTimeOffset: pedirlo
    /// directo tira InvalidCastException. Se lee crudo y se envuelve acá.
    /// </summary>
    private static DateTimeOffset? AsOffset(DateTime? raw) =>
        raw is { } value
            ? new DateTimeOffset(DateTime.SpecifyKind(value, DateTimeKind.Utc))
            : null;

    /// <summary>Cuántas reseñas junta una cátedra y cuándo entró la última.</summary>
    private sealed record ChairCountRow(Guid ChairId, int ReviewCount, DateTime? LastReviewedAt);

    /// <summary>
    /// Fila plana del conteo por cátedra, antes de agruparse por frase. La ficha de materia contrasta
    /// cátedras entre sí sobre la misma pregunta, así que su query solo trae las frases vigentes: un
    /// tramo viejo ahí sería exactamente la comparación que US-198 no permite hacer.
    /// </summary>
    private sealed record ChairTallyRow(
        Guid ChairId,
        string ItemCode,
        string Layer,
        short Value,
        short Order,
        string Label,
        string Valence,
        int Count)
    {
        public TallyRow ToTallyRow() =>
            new(
                ItemCode,
                Layer,
                IsRetired: false,
                SupersedesCode: null,
                RetiredAt: null,
                Value,
                Order,
                Label,
                Valence,
                Count);
    }
}
