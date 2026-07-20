using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Academic.Application.Features.AdminSubjects;

/// <summary>
/// PATCH /api/academic/subjects/{id:guid} (admin, US-062). Replace del form completo de la
/// materia. Gateado a rol Admin.
/// </summary>
public sealed class UpdateSubjectEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPatch("/api/academic/subjects/{id:guid}", async (
            Guid id,
            UpdateSubjectRequest body,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            // Guid.Empty pasa el route constraint :guid (es un guid sintácticamente válido) pero
            // SubjectId lo rechaza en su ctor: cortamos acá para devolver 404 limpio en vez de
            // dejar que el value object tire ArgumentException.
            if (id == Guid.Empty)
            {
                return Results.Problem(
                    title: "academic.subject.not_found",
                    detail: "Subject not found.",
                    statusCode: StatusCodes.Status404NotFound);
            }

            var termKind = SubjectEnumParsing.ParseTermKind(body.TermKind);
            if (termKind.IsFailure)
            {
                return Results.Problem(
                    title: termKind.Error.Code, detail: termKind.Error.Message,
                    statusCode: StatusCodes.Status400BadRequest);
            }

            var command = new UpdateSubjectCommand(
                id, body.Code, body.Name, body.YearInPlan, body.TermInYear, termKind.Value,
                body.WeeklyHours, body.TotalHours, body.Description);

            try
            {
                var result = await bus.InvokeAsync<Result<UpdateSubjectResponse>>(command, ct);
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
        .WithName("Academic_UpdateSubject")
        .WithTags("Academic")
        .RequireAuthorization(p => p.RequireRole(AdminSubjectPolicy.RoleName))
        .Produces<UpdateSubjectResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }
}

/// <summary>
/// Body del PATCH. Mismos campos que el alta (US-062). TermKind viaja como string (el endpoint lo
/// parsea).
/// </summary>
public sealed record UpdateSubjectRequest(
    string Code,
    string Name,
    int YearInPlan,
    int? TermInYear,
    string? TermKind,
    int WeeklyHours,
    int TotalHours,
    string? Description);
