using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Academic.Application.Features.AdminTeachers;

/// <summary>
/// DELETE /api/academic/teachers/{id} (admin, US-063). Soft delete: preserva la integridad histórica
/// (las reseñas anclan al id). Gateado a rol Admin.
/// </summary>
public sealed class DeactivateTeacherEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapDelete("/api/academic/teachers/{id:guid}", async (
            Guid id,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            if (id == Guid.Empty)
            {
                return Results.Problem(
                    title: "academic.teacher.not_found",
                    detail: "Teacher not found.",
                    statusCode: StatusCodes.Status404NotFound);
            }

            var result = await bus.InvokeAsync<Result<TeacherStatusResponse>>(
                new DeactivateTeacherCommand(id), ct);
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
        .WithName("Academic_DeactivateTeacher")
        .WithTags("Academic")
        .RequireAuthorization(p => p.RequireRole(AdminTeacherPolicy.RoleName))
        .Produces<TeacherStatusResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }
}
