using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Academic.Application.Features.AdminPrerequisites;

/// <summary>
/// POST /api/academic/subjects/{subjectId:guid}/prerequisites (admin, US-062). Alta de una
/// correlativa entre dos materias del mismo plan. Gateado a rol Admin.
/// </summary>
public sealed class CreatePrerequisiteEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/academic/subjects/{subjectId:guid}/prerequisites", async (
            Guid subjectId,
            CreatePrerequisiteRequest body,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            // Guid.Empty pasa el route constraint :guid pero SubjectId lo rechaza en su ctor:
            // cortamos acá para devolver 404 limpio (mismo criterio que CreateAcademicTermEndpoint).
            if (subjectId == Guid.Empty)
            {
                return Results.Problem(
                    title: "academic.subject.not_found",
                    detail: "Subject not found.",
                    statusCode: StatusCodes.Status404NotFound);
            }

            var type = PrerequisiteEnumParsing.ParseType(body.Type);
            if (type.IsFailure)
            {
                return Results.Problem(
                    title: type.Error.Code, detail: type.Error.Message,
                    statusCode: StatusCodes.Status400BadRequest);
            }

            var command = new CreatePrerequisiteCommand(subjectId, body.RequiredSubjectId, type.Value);

            try
            {
                var result = await bus.InvokeAsync<Result<CreatePrerequisiteResponse>>(command, ct);
                if (result.IsSuccess)
                {
                    return Results.Created(
                        $"/api/academic/subjects/{subjectId}/prerequisites", result.Value);
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
        .WithName("Academic_CreatePrerequisite")
        .WithTags("Academic")
        .RequireAuthorization(p => p.RequireRole(AdminPrerequisitePolicy.RoleName))
        .Produces<CreatePrerequisiteResponse>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }
}

/// <summary>Body del POST. RequiredSubjectId + type (string, "ParaCursar"/"ParaRendir") requeridos.</summary>
public sealed record CreatePrerequisiteRequest(Guid RequiredSubjectId, string? Type);
