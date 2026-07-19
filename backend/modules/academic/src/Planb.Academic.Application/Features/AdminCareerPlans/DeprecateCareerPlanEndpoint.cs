using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Academic.Application.Features.AdminCareerPlans;

/// <summary>
/// POST /api/academic/career-plans/{id:guid}/deprecate (admin, US-061). Archiva el plan: pasa de
/// Active a Deprecated. El plan sigue existiendo y los alumnos asociados quedan en él; solo deja de
/// ser el vigente para nuevos ingresos. Gateado a rol Admin.
/// </summary>
public sealed class DeprecateCareerPlanEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/academic/career-plans/{id:guid}/deprecate", async (
            Guid id,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            if (id == Guid.Empty)
            {
                return Results.Problem(
                    title: "academic.career_plan.not_found",
                    detail: "Career plan not found.",
                    statusCode: StatusCodes.Status404NotFound);
            }

            var result = await bus.InvokeAsync<Result<CareerPlanStatusResponse>>(
                new DeprecateCareerPlanCommand(id), ct);
            if (result.IsSuccess)
            {
                return Results.Ok(result.Value);
            }

            var error = result.Error;
            var statusCode = error.Type switch
            {
                ErrorType.Validation => StatusCodes.Status400BadRequest,
                ErrorType.NotFound => StatusCodes.Status404NotFound,
                ErrorType.Conflict => StatusCodes.Status409Conflict,
                ErrorType.Forbidden => StatusCodes.Status403Forbidden,
                ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
                _ => StatusCodes.Status500InternalServerError,
            };
            return Results.Problem(title: error.Code, detail: error.Message, statusCode: statusCode);
        })
        .WithName("Academic_DeprecateCareerPlan")
        .WithTags("Academic")
        .RequireAuthorization(p => p.RequireRole(AdminCareerPlanPolicy.RoleName))
        .Produces<CareerPlanStatusResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }
}
