using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Abstractions.Security;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Planning.Application.Features.UpdateSimulationDraft;

/// <summary>
/// PATCH /api/me/simulations/drafts/{id} (US-023). Reemplaza label + items del borrador propio. 404
/// si no existe, 403 si existe pero es de otro alumno.
/// </summary>
public sealed class UpdateSimulationDraftEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPatch("/api/me/simulations/drafts/{id:guid}", async (
            Guid id,
            UpdateSimulationDraftRequest body,
            HttpContext http,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var userId = CurrentUser.RequireUserId(http);

            var items = (body.Items ?? [])
                .Select(i => new UpdateSimulationDraftItemInput(i.SubjectId, i.CommissionId))
                .ToList();

            var command = new UpdateSimulationDraftCommand(userId.Value, id, body.Label, items);

            try
            {
                var result = await bus.InvokeAsync<Result<UpdateSimulationDraftResponse>>(command, ct);
                if (result.IsSuccess)
                {
                    return Results.Ok(result.Value);
                }

                var error = result.Error;
                var statusCode = error.Code switch
                {
                    "planning.simulation_draft.rate_limit_exceeded" => StatusCodes.Status429TooManyRequests,
                    _ => error.Type switch
                    {
                        ErrorType.Validation => StatusCodes.Status400BadRequest,
                        ErrorType.NotFound => StatusCodes.Status404NotFound,
                        ErrorType.Conflict => StatusCodes.Status409Conflict,
                        ErrorType.Forbidden => StatusCodes.Status403Forbidden,
                        ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
                        _ => StatusCodes.Status500InternalServerError,
                    },
                };
                return Results.Problem(title: error.Code, detail: error.Message, statusCode: statusCode);
            }
            catch (ValidationException ex)
            {
                var errors = ex.Errors.GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
                return Results.ValidationProblem(errors);
            }
        })
        .WithName("Planning_UpdateSimulationDraft")
        .WithTags("Planning")
        .RequireAuthorization()
        .Produces<UpdateSimulationDraftResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict)
        .ProducesProblem(StatusCodes.Status429TooManyRequests);
    }
}
