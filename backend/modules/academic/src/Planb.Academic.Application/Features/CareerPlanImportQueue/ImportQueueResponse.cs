namespace Planb.Academic.Application.Features.CareerPlanImportQueue;

/// <summary>Response de la cola de imports (US-088): página de items + paginación offset.</summary>
public sealed record ImportQueueResponse(
    IReadOnlyList<ImportQueueItem> Items,
    int Page,
    int PageSize,
    int TotalCount);
