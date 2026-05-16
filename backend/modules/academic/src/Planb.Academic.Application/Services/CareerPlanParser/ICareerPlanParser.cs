using Planb.Academic.Domain.CareerPlanImports;

namespace Planb.Academic.Application.Services.CareerPlanParser;

/// <summary>
/// Port del parser heurístico de planes de estudio (US-088). Pure: no toca DB ni network,
/// recibe texto crudo y devuelve <see cref="CareerPlanImportPayload"/>. La impl concreta es
/// <c>CareerPlanParser</c> en este mismo módulo Application.
/// </summary>
public interface ICareerPlanParser
{
    CareerPlanImportPayload Parse(string rawText);
}
