using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Academic.Application.Features.AdminCareerPlans;

/// <summary>
/// POST /api/academic/careers/{careerId:guid}/plans (admin, US-061). Alta de un plan de estudios
/// para una carrera. Gateado a rol Admin (backoffice): agregar planes es una operación de catálogo,
/// no de self-service (a diferencia del import crowdsourced de US-088).
/// </summary>
public sealed class CreateCareerPlanEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/academic/careers/{careerId:guid}/plans", async (
            Guid careerId,
            CreateCareerPlanRequest body,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            // Guid.Empty pasa el route constraint :guid (es un guid sintácticamente válido) pero
            // CareerId lo rechaza en su ctor: cortamos acá para devolver 404 limpio en vez de
            // dejar que el value object tire ArgumentException.
            if (careerId == Guid.Empty)
            {
                return Results.Problem(
                    title: "academic.career.not_found",
                    detail: "Career not found.",
                    statusCode: StatusCodes.Status404NotFound);
            }

            var command = new CreateCareerPlanCommand(careerId, body.Year);

            var result = await bus.InvokeAsync<Result<CreateCareerPlanResponse>>(command, ct);
            if (result.IsSuccess)
            {
                return Results.Created(
                    $"/api/academic/career-plans/{result.Value.Id}", result.Value);
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
            return Results.Problem(
                title: error.Code, detail: error.Message, statusCode: statusCode);
        })
        .WithName("Academic_CreateCareerPlan")
        .WithTags("Academic")
        .RequireAuthorization(p => p.RequireRole(AdminCareerPlanPolicy.RoleName))
        .Produces<CreateCareerPlanResponse>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }
}

/// <summary>Body del POST. Year requerido (el dominio valida rango: positivo y no futuro).</summary>
public sealed record CreateCareerPlanRequest(int Year);
