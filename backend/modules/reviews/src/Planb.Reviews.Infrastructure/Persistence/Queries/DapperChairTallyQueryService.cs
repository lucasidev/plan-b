using System.Data;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Domain.Catalog;
using Planb.Reviews.Domain.CourseReviews;
using Planb.Reviews.Domain.Publishing;

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
///     El denominador de cada ítem son sus propias respuestas, no las reseñas de la cátedra. Lo
///     salteado no deja fila (ADR-0082), así que dos ítems de la misma cátedra pueden tener
///     denominadores distintos y eso es correcto, no un bug de la query.
///   </item>
/// </list>
/// </summary>
internal sealed class DapperChairTallyQueryService : IChairTallyQueryService
{
    private readonly string _connectionString;

    public DapperChairTallyQueryService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Planb")
            ?? throw new InvalidOperationException(
                "ConnectionStrings:Planb is required for DapperChairTallyQueryService.");
    }

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
            FROM reviews.course_reviews
            WHERE chair_id = @ChairId;

            SELECT
                i.code    AS ItemCode,
                i.layer   AS Layer,
                o.value   AS Value,
                o.""order"" AS ""Order"",
                o.label   AS Label,
                o.valence AS Valence,
                count(a.course_review_id)::int AS Count
            FROM reviews.items i
            JOIN reviews.item_options o ON o.item_id = i.id
            LEFT JOIN reviews.course_review_answers a
                ON a.item_id = i.id
               AND a.option_value = o.value
               AND a.course_review_id IN (
                   SELECT id FROM reviews.course_reviews WHERE chair_id = @ChairId)
            WHERE i.is_active = true
            GROUP BY i.code, i.layer, o.value, o.""order"", o.label, o.valence
            ORDER BY i.code, o.""order"";

            SELECT
                i.code    AS ItemCode,
                i.layer   AS Layer,
                o.value   AS Value,
                o.""order"" AS ""Order"",
                o.label   AS Label,
                o.valence AS Valence,
                count(a.course_review_id)::int AS Count
            FROM reviews.items i
            JOIN reviews.item_options o ON o.item_id = i.id
            LEFT JOIN reviews.course_review_answers a
                ON a.item_id = i.id
               AND a.option_value = o.value
               AND a.course_review_id IN (
                   SELECT id FROM reviews.course_reviews WHERE chair_id = ANY(@SiblingIds))
            WHERE i.is_active = true
            GROUP BY i.code, i.layer, o.value, o.""order"", o.label, o.valence
            ORDER BY i.code, o.""order"";

            SELECT i.code AS Code, i.text AS Text
            FROM reviews.items i
            WHERE i.is_active = true;

            SELECT DISTINCT term_id
            FROM reviews.course_reviews
            WHERE chair_id = @ChairId;

            SELECT max(created_at)
            FROM reviews.course_reviews
            WHERE chair_id = @ChairId;";

        using IDbConnection db = new NpgsqlConnection(_connectionString);
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
    /// Agrupa las filas planas en un <see cref="ItemTally"/> por ítem. El orden de las opciones
    /// viene del SQL y se respeta: es el orden en que se ofrecieron al responder, y la ficha dibuja
    /// la distribución en ese mismo orden.
    /// </summary>
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
                    .ToList()))
            .ToList();

    /// <summary>
    /// La tasa de finalización sale del mismo conteo del desenlace que ya vino, sin otra query: es
    /// una lectura distinta de las mismas filas. Si nadie contestó ese ítem, no hay tasa (null), que
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

    /// <summary>Fila plana del SQL, antes de agruparse por ítem.</summary>
    private sealed record TallyRow(
        string ItemCode,
        string Layer,
        short Value,
        short Order,
        string Label,
        string Valence,
        int Count);

    /// <summary>El texto de un ítem, para que la respuesta pueda enunciarlo en castellano.</summary>
    private sealed record ItemTextRow(string Code, string Text);
}
