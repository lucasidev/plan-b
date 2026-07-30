using Planb.Academic.Domain.CareerPlanImports;

namespace Planb.Academic.Application.Features.CareerPlanImportQueue;

/// <summary>
/// Read-side de la cola de imports de plan de estudios para el staff (US-088). Antes de esto
/// <c>ICareerPlanImportRepository</c> no tenía forma de enumerar imports, así que no podía existir
/// una cola: el staff no tenía cómo ver qué había pendiente de revisión. Reader interno del feature,
/// mismo patrón que <c>IReportQueueReader</c> de Moderation.
/// </summary>
public interface IImportQueueReader
{
    Task<ImportQueueReadResult> ReadAsync(ImportQueueFilter filter, CancellationToken ct = default);
}

/// <summary>Filtros de la cola. <see cref="Status"/> null = todos los estados.</summary>
public sealed record ImportQueueFilter(
    CareerPlanImportStatus? Status,
    int Page,
    int PageSize);

/// <summary>Resultado del read: la página de items + el total (paginación offset, ADR-0056).</summary>
public sealed record ImportQueueReadResult(
    IReadOnlyList<ImportQueueItem> Items,
    int TotalCount);
