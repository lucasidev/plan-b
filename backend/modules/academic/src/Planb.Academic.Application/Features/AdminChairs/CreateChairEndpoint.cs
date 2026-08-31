using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Academic.Application.Features.AdminChairs;

/// <summary>
/// POST /api/academic/subjects/{subjectId}/chairs (admin, US-196).
///
/// <para>
/// La entrada es <b>por materia</b> y no por la cascada de universidad y período que usa la
/// comisión: la cátedra es de una materia y persiste entre períodos, así que colgarla de un término
/// sería modelar mal la cosa que se está cargando.
/// </para>
/// </summary>
public sealed class CreateChairEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/academic/subjects/{subjectId:guid}/chairs", async (
            Guid subjectId,
            CreateChairRequest body,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var command = new CreateChairCommand(subjectId, body.Name);

            try
            {
                var result = await bus.InvokeAsync<Result<CreateChairResponse>>(command, ct);
                if (result.IsSuccess)
                {
                    return Results.Created(
                        $"/api/academic/chairs/{result.Value.Id}", result.Value);
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
            }
            catch (ValidationException ex)
            {
                var errors = ex.Errors.GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
                return Results.ValidationProblem(errors);
            }
        })
        .WithName("Academic_CreateChair")
        .WithTags("Academic")
        .RequireAuthorization(p => p.RequireRole(AdminChairPolicy.RoleName))
        .Produces<CreateChairResponse>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }
}
