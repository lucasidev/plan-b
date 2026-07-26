using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Abstractions.Security;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Planning.Application.Features.CreateSimulationDraft;

/// <summary>
/// POST /api/me/simulations/drafts (US-023). Guarda una simulación tentativa como borrador privado.
/// El owner es el StudentProfile del user autenticado (JWT), no un id del body.
/// </summary>
public sealed class CreateSimulationDraftEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/me/simulations/drafts", async (
            CreateSimulationDraftRequest body,
            HttpContext http,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var userId = CurrentUser.RequireUserId(http);

            var items = (body.Items ?? [])
                .Select(i => new CreateSimulationDraftItemInput(i.SubjectId, i.CommissionId))
                .ToList();

            var command = new CreateSimulationDraftCommand(userId.Value, body.TermId, body.Label, items);

            try
            {
                var result = await bus.InvokeAsync<Result<CreateSimulationDraftResponse>>(command, ct);
                if (result.IsSuccess)
                {
                    return Results.Created(
                        $"/api/me/simulations/drafts/{result.Value.Id}", result.Value);
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
        .WithName("Planning_CreateSimulationDraft")
        .WithTags("Planning")
        .RequireAuthorization()
        .Produces<CreateSimulationDraftResponse>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict)
        .ProducesProblem(StatusCodes.Status429TooManyRequests);
    }
}
