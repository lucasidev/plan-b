using System.Data;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Planb.Moderation.Application.Features.ReportQueue;

namespace Planb.Moderation.Infrastructure.Reading;

/// <summary>
/// Dapper implementation de la cola de reportes (US-050). Query cross-schema: moderation.review_reports
/// LEFT JOIN reviews.reviews para el snippet (body de la reseña truncado). Permitido por ADR-0017 (los
/// reads no requieren FK). Una sola roundtrip (QueryMultiple) devuelve counts + página de items.
///
/// <para>
/// El mapa motivo → tono vive acá (read model / presentation), no en el dominio: no es un invariante
/// del reporte, y computarlo en SQL permite ordenar + paginar por urgencia. Los 5 motivos reales del
/// enum ReviewReportReason. Si crece o se vuelve config-driven (US-050 lo sugiere), se extrae.
/// </para>
/// </summary>
internal sealed class DapperReportQueueReader : IReportQueueReader
{
    private const string ToneExpr =
        "CASE WHEN reason IN ('DatosPersonales','LenguajeInapropiado') THEN 'urgent' " +
        "WHEN reason IN ('Difamacion','Spam') THEN 'normal' ELSE 'low' END";

    private const string ToneRankExpr =
        "CASE WHEN reason IN ('DatosPersonales','LenguajeInapropiado') THEN 0 " +
        "WHEN reason IN ('Difamacion','Spam') THEN 1 ELSE 2 END";

    private readonly string _connectionString;

    public DapperReportQueueReader(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Planb")
            ?? throw new InvalidOperationException(
                "ConnectionStrings:Planb is required for DapperReportQueueReader.");
    }

    public async Task<ReportQueueReadResult> ReadAsync(
        ReportQueueFilter filter, CancellationToken ct = default)
    {
        var offset = (filter.Page - 1) * filter.PageSize;

        var countsSql = @"
            SELECT
                count(*) FILTER (WHERE status = 'Open') AS OpenCount,
                count(*) FILTER (WHERE status IN ('Upheld','Dismissed')
                    AND created_at > now() - interval '7 days') AS ClosedLast7d,
                count(*) FILTER (WHERE status = 'Open'
                    AND reason IN ('DatosPersonales','LenguajeInapropiado')) AS UrgentCount,
                count(*) FILTER (WHERE status = 'Open'
                    AND reason IN ('Difamacion','Spam')) AS NormalCount,
                count(*) FILTER (WHERE status = 'Open'
                    AND reason NOT IN ('DatosPersonales','LenguajeInapropiado','Difamacion','Spam'))
                    AS LowCount,
                count(*) FILTER (WHERE status = 'Open'
                    AND created_at < now() - interval '48 hours') AS StaleCount
            FROM moderation.review_reports;";

        var itemsSql = $@"
            WITH q AS (
                SELECT rr.id, rr.created_at, rr.reason, rr.review_id, rr.reporter_user_id, rr.status,
                       {ToneExpr} AS tone,
                       {ToneRankExpr} AS tone_rank
                FROM moderation.review_reports rr
            )
            SELECT
                q.id               AS Id,
                q.created_at       AS CreatedAt,
                q.reason           AS Reason,
                left(r.subject_text, 140) AS Snippet,
                q.review_id        AS TargetReviewId,
                q.reporter_user_id AS ReporterUserId,
                q.tone             AS Tone,
                count(*) OVER()::int AS TotalCount
            FROM q
            LEFT JOIN reviews.reviews r ON r.id = q.review_id
            WHERE ((@OpenOnly AND q.status = 'Open')
                   OR (NOT @OpenOnly AND q.status IN ('Upheld','Dismissed')))
              AND (@Tone IS NULL OR q.tone = @Tone)
              AND (@OlderThanDays IS NULL OR q.created_at < now() - make_interval(days => @OlderThanDays))
            ORDER BY q.tone_rank, q.created_at ASC
            OFFSET @Offset LIMIT @Limit;";

        var parameters = new
        {
            filter.OpenOnly,
            filter.Tone,
            filter.OlderThanDays,
            Offset = offset,
            Limit = filter.PageSize,
        };

        using IDbConnection db = new NpgsqlConnection(_connectionString);
        using var multi = await db.QueryMultipleAsync(
            new CommandDefinition(countsSql + itemsSql, parameters, cancellationToken: ct));

        var counts = await multi.ReadSingleAsync<ReportQueueCounts>();
        var rows = (await multi.ReadAsync<Row>()).ToList();

        var total = rows.Count > 0 ? rows[0].TotalCount : 0;
        var items = rows
            .Select(r => new ReportQueueItem
            {
                Id = r.Id,
                CreatedAt = r.CreatedAt,
                Reason = r.Reason,
                Snippet = r.Snippet,
                TargetReviewId = r.TargetReviewId,
                ReporterUserId = r.ReporterUserId,
                Tone = r.Tone,
            })
            .ToList();

        return new ReportQueueReadResult(counts, items, total);
    }

    /// <summary>Fila cruda: los campos del item + el total de la ventana (count(*) OVER()).</summary>
    private sealed record Row
    {
        public Guid Id { get; init; }
        public DateTime CreatedAt { get; init; }
        public string Reason { get; init; } = string.Empty;
        public string? Snippet { get; init; }
        public Guid TargetReviewId { get; init; }
        public Guid ReporterUserId { get; init; }
        public string Tone { get; init; } = "low";
        public int TotalCount { get; init; }
    }
}
