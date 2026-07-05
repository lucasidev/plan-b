namespace Planb.Moderation.Application.Features.ReportQueue;

/// <summary>Response de la cola de reportes (US-050): counts + página de items + paginación.</summary>
public sealed record ReportQueueResponse(
    ReportQueueCounts Counts,
    IReadOnlyList<ReportQueueItem> Items,
    int Page,
    int PageSize,
    int TotalCount);
