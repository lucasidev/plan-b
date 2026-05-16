using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Abstractions.Security;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Enrollments.Application.Features.HistorialImports;

/// <summary>
/// POST /api/me/historial-imports/{id}/confirm (US-014).
///
/// El user revisó el preview parseado y eligió qué items importar (con sus eventuales
/// overrides). El endpoint dispara el handler que crea un <c>EnrollmentRecord</c> por item
/// (con conflict resolution: si ya hay record con misma triple student+subject+term, skip),
/// transiciona el import a <c>Confirmed</c> y commitea atómico.
/// </summary>
public sealed class ConfirmHistorialImportEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/me/historial-imports/{id:guid}/confirm", async (
            Guid id,
            ConfirmHistorialImportRequest body,
            HttpContext http,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var userId = CurrentUser.RequireUserId(http);

            if (body.Items is null || body.Items.Count == 0)
            {
                return Results.Problem(
                    title: "enrollments.import.empty_confirm",
                    detail: "Tenés que elegir al menos un item para confirmar.",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            var command = new ConfirmHistorialImportCommand(
                userId.Value,
                id,
                body.Items);

            try
            {
                var result = await bus.InvokeAsync<Result<ConfirmHistorialImportResponse>>(command, ct);
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
        .WithName("Enrollments_ConfirmHistorialImport")
        .WithTags("Enrollments")
        .RequireAuthorization()
        .Produces<ConfirmHistorialImportResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }
}

/// <summary>
/// Body del POST confirm: la lista de items seleccionados (con sus eventuales overrides).
/// </summary>
public sealed record ConfirmHistorialImportRequest(IReadOnlyList<ConfirmedItem> Items);
