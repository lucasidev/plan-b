namespace Planb.Moderation.Application.Features.ReportQueue;

/// <summary>
/// Read-side de la cola de reportes (US-050). No es cross-BC en el sentido de Contracts (lo consume
/// el propio módulo Moderation), pero la query SÍ cruza schemas (moderation.review_reports JOIN
/// reviews.reviews para el snippet), permitido por ADR-0017 (los reads no requieren FK). Reader
/// interno del feature, patrón `ICatalogSearchReader` / `IAdminTeacherReader`.
/// </summary>
public interface IReportQueueReader
{
    Task<ReportQueueReadResult> ReadAsync(ReportQueueFilter filter, CancellationToken ct = default);
}

/// <summary>
/// Filtros de la cola. <see cref="OpenOnly"/> false = vista cerrados (upheld + dismissed).
/// <see cref="Tone"/> null = todos. <see cref="OlderThanDays"/> filtra reportes con más de N días.
/// </summary>
public sealed record ReportQueueFilter(
    bool OpenOnly,
    string? Tone,
    int? OlderThanDays,
    int Page,
    int PageSize);

/// <summary>Resultado del read: counts globales + la página de items + el total (para paginación).</summary>
public sealed record ReportQueueReadResult(
    ReportQueueCounts Counts,
    IReadOnlyList<ReportQueueItem> Items,
    int TotalCount);
