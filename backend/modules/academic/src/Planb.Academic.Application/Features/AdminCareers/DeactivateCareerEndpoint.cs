using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Academic.Application.Features.AdminCareers;

/// <summary>
/// DELETE /api/academic/careers/{id} (admin, US-061). Soft delete: preserva la integridad
/// histórica (career plans/subjects anclan al id sin FK cross-schema, ADR-0017). Gateado a rol Admin.
/// </summary>
public sealed class DeactivateCareerEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapDelete("/api/academic/careers/{id:guid}", async (
            Guid id,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            if (id == Guid.Empty)
            {
                return Results.Problem(
                    title: "academic.career.not_found",
                    detail: "Career not found.",
                    statusCode: StatusCodes.Status404NotFound);
            }

            var result = await bus.InvokeAsync<Result<CareerStatusResponse>>(
                new DeactivateCareerCommand(id), ct);
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
        .WithName("Academic_DeactivateCareer")
        .WithTags("Academic")
        .RequireAuthorization(p => p.RequireRole(AdminCareerPolicy.RoleName))
        .Produces<CareerStatusResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }
}
