using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Academic.Application.Features.AdminChairs;

/// <summary>
/// POST /api/academic/chairs/{chairId}/members/{teacherId}/close (admin, US-196). Cierra el tramo
/// de un docente en un período.
///
/// <para>
/// Es POST y no DELETE a propósito: DELETE prometería que la fila desaparece, y lo que pasa es lo
/// contrario. El tramo se conserva con su "hasta", porque lo que esa persona dictó sigue siendo
/// cierto y las reseñas de esos períodos le pertenecen.
/// </para>
/// </summary>
public sealed class CloseChairMemberEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/academic/chairs/{chairId:guid}/members/{teacherId:guid}/close", async (
            Guid chairId,
            Guid teacherId,
            CloseChairMemberRequest body,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var command = new CloseChairMemberCommand(chairId, teacherId, body.UntilTermId);

            try
            {
                var result = await bus.InvokeAsync<Result>(command, ct);
                if (result.IsSuccess)
                {
                    return Results.NoContent();
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
        .WithName("Academic_CloseChairMember")
        .WithTags("Academic")
        .RequireAuthorization(p => p.RequireRole(AdminChairPolicy.RoleName))
        .Produces(StatusCodes.Status204NoContent)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }
}
