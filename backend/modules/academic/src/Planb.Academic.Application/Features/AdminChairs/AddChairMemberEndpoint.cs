using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Academic.Application.Features.AdminChairs;

/// <summary>
/// POST /api/academic/chairs/{chairId}/members (admin, US-196). Suma un docente al equipo desde
/// un período. El equipo se versiona: quien entra queda con su "desde", y nadie se pisa.
/// </summary>
public sealed class AddChairMemberEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/academic/chairs/{chairId:guid}/members", async (
            Guid chairId,
            AddChairMemberRequest body,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var role = ChairEnumParsing.ParseMemberRole(body.Role);
            if (role.IsFailure)
            {
                return Results.Problem(
                    title: role.Error.Code,
                    detail: role.Error.Message,
                    statusCode: StatusCodes.Status400BadRequest);
            }

            var command = new AddChairMemberCommand(
                chairId, body.TeacherId, role.Value, body.SinceTermId);

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
        .WithName("Academic_AddChairMember")
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
