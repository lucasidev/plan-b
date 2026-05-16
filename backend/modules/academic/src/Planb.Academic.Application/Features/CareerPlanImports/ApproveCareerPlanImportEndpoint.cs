using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Academic.Application.Abstractions.Security;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Academic.Application.Features.CareerPlanImports;

/// <summary>
/// POST /api/me/career-plan-imports/{id}/approve. Body: array de items seleccionados (con
/// eventuales overrides del alumno). Crea el CareerPlan + sus Subjects en bloque y devuelve
/// el careerPlanId para que el frontend complete el onboarding paso 2.
/// </summary>
public sealed class ApproveCareerPlanImportEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/me/career-plan-imports/{id:guid}/approve", async (
            Guid id,
            ApproveCareerPlanImportRequest body,
            HttpContext http,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var userId = CurrentUser.RequireUserId(http);

            if (body.Items is null || body.Items.Count == 0)
            {
                return Results.Problem(
                    title: "academic.plan_import.empty_approve",
                    detail: "Elegí al menos una materia para crear el plan.",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            var command = new ApproveCareerPlanImportCommand(userId, id, body.Items);

            try
            {
                var result = await bus.InvokeAsync<Result<ApproveCareerPlanImportResponse>>(command, ct);
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
                return Results.Problem(
                    title: error.Code,
                    detail: error.Message,
                    statusCode: statusCode);
            }
            catch (ValidationException ex)
            {
                var errors = ex.Errors.GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
                return Results.ValidationProblem(errors);
            }
        })
        .WithName("Academic_ApproveCareerPlanImport")
        .WithTags("Academic")
        .RequireAuthorization()
        .Produces<ApproveCareerPlanImportResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }
}

public sealed record ApproveCareerPlanImportRequest(IReadOnlyList<ApproveSubjectItem> Items);
