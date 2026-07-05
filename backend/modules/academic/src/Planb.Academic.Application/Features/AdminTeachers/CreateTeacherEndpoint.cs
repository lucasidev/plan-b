using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Academic.Application.Features.AdminTeachers;

/// <summary>
/// POST /api/academic/teachers (admin, US-063). Alta de un docente del catálogo. Gateado a rol Admin
/// (backoffice): staff no se auto-registra (ADR-0008), y crear docentes es una operación de catálogo.
/// </summary>
public sealed class CreateTeacherEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/academic/teachers", async (
            CreateTeacherRequest body,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var command = new CreateTeacherCommand(
                body.UniversityId,
                body.FirstName,
                body.LastName,
                body.Title,
                body.Bio,
                body.PhotoUrl);

            try
            {
                var result = await bus.InvokeAsync<Result<CreateTeacherResponse>>(command, ct);
                if (result.IsSuccess)
                {
                    return Results.Created(
                        $"/api/academic/teachers/{result.Value.Id}", result.Value);
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
        .WithName("Academic_CreateTeacher")
        .WithTags("Academic")
        .RequireAuthorization(p => p.RequireRole(AdminTeacherPolicy.RoleName))
        .Produces<CreateTeacherResponse>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}

/// <summary>Body del POST. UniversityId + nombres requeridos; title/bio/photoUrl opcionales.</summary>
public sealed record CreateTeacherRequest(
    Guid UniversityId,
    string FirstName,
    string LastName,
    string? Title,
    string? Bio,
    string? PhotoUrl);
