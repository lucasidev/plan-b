using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Academic.Application.Features.CareerPlanImports;
using Planb.Academic.Domain.CareerPlanImports;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.CareerPlanImportQueue;

/// <summary>
/// GET /api/academic/career-plan-imports (staff, US-088). Cola de imports: filtra por estado y
/// devuelve, por cada uno, las carreras existentes de esa universidad que se parecen al nombre
/// propuesto, para decidir "aprobar" o "rechazar" sin duplicar el catálogo. Gateada a rol Admin
/// (mismo escritor único del catálogo que <c>ApproveCareerPlanImportEndpoint</c>): inyecta el reader
/// directo, no <c>IMessageBus</c>, porque es un read.
///
/// <para>
/// Query params: <c>?status=Pending|Parsing|Parsed|Failed|Approved|Rejected</c> (default: todos),
/// <c>?page=</c> (default 1), <c>?pageSize=</c> (default 20, máx 100).
/// </para>
/// </summary>
public sealed class ListCareerPlanImportQueueEndpoint : ICarterModule
{
    public const int DefaultPageSize = 20;
    public const int MaxPageSize = 100;

    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/academic/career-plan-imports", async (
            string? status,
            int? page,
            int? pageSize,
            IImportQueueReader reader,
            CancellationToken ct) =>
        {
            CareerPlanImportStatus? parsedStatus = null;
            if (!string.IsNullOrWhiteSpace(status))
            {
                if (!StrictEnum.TryParse<CareerPlanImportStatus>(status, out var value))
                {
                    return Results.Problem(
                        title: "academic.plan_import.invalid_status",
                        detail: "status debe ser Pending, Parsing, Parsed, Failed, Approved o Rejected.",
                        statusCode: StatusCodes.Status400BadRequest);
                }
                parsedStatus = value;
            }

            var pageNum = Math.Max(1, page ?? 1);
            var size = Math.Clamp(pageSize ?? DefaultPageSize, 1, MaxPageSize);

            var filter = new ImportQueueFilter(parsedStatus, pageNum, size);
            var result = await reader.ReadAsync(filter, ct);

            return Results.Ok(new ImportQueueResponse(result.Items, pageNum, size, result.TotalCount));
        })
        .WithName("Academic_ListCareerPlanImportQueue")
        .WithTags("Academic")
        .RequireAuthorization(p => p.RequireRole(CareerPlanImportPolicy.RoleName))
        .Produces<ImportQueueResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden);
    }
}
