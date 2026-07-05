using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Academic.Application.Features.AdminTeachers;

/// <summary>
/// PATCH /api/academic/teachers/{id} (admin, US-063). Replace del form completo del docente. Gateado
/// a rol Admin.
/// </summary>
public sealed class UpdateTeacherEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPatch("/api/academic/teachers/{id:guid}", async (
            Guid id,
            UpdateTeacherRequest body,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var command = new UpdateTeacherCommand(
                id,
                body.FirstName,
                body.LastName,
                body.Title,
                body.Bio,
                body.PhotoUrl);

            try
            {
                var result = await bus.InvokeAsync<Result<UpdateTeacherResponse>>(command, ct);
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
                    title: error.Code, detail: error.Message, statusCode: statusCode);
            }
            catch (ValidationException ex)
            {
                var errors = ex.Errors.GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
                return Results.ValidationProblem(errors);
            }
        })
        .WithName("Academic_UpdateTeacher")
        .WithTags("Academic")
        .RequireAuthorization(p => p.RequireRole(AdminTeacherPolicy.RoleName))
        .Produces<UpdateTeacherResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}

/// <summary>Body del PATCH. Nombres requeridos; title/bio/photoUrl opcionales (vacío limpia).</summary>
public sealed record UpdateTeacherRequest(
    string FirstName,
    string LastName,
    string? Title,
    string? Bio,
    string? PhotoUrl);
