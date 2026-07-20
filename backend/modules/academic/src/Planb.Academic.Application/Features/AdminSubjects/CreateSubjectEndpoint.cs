using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Academic.Application.Features.AdminSubjects;

/// <summary>
/// POST /api/academic/career-plans/{planId:guid}/subjects (admin, US-062). Alta de una materia
/// anclada a un plan de estudios. Gateado a rol Admin.
/// </summary>
public sealed class CreateSubjectEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/academic/career-plans/{planId:guid}/subjects", async (
            Guid planId,
            CreateSubjectRequest body,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            // Guid.Empty pasa el route constraint :guid (es un guid sintácticamente válido) pero
            // CareerPlanId lo rechaza en su ctor: cortamos acá para devolver 404 limpio en vez de
            // dejar que el value object tire ArgumentException.
            if (planId == Guid.Empty)
            {
                return Results.Problem(
                    title: "academic.career_plan.not_found",
                    detail: "Career plan not found.",
                    statusCode: StatusCodes.Status404NotFound);
            }

            // TermKind es obligatorio (a diferencia de DegreeType/Cadence de Career), pero un
            // string no-vacío inválido se rechaza con 400 (no null silencioso): un typo del admin
            // no se traga.
            var termKind = SubjectEnumParsing.ParseTermKind(body.TermKind);
            if (termKind.IsFailure)
            {
                return Results.Problem(
                    title: termKind.Error.Code, detail: termKind.Error.Message,
                    statusCode: StatusCodes.Status400BadRequest);
            }

            var command = new CreateSubjectCommand(
                planId, body.Code, body.Name, body.YearInPlan, body.TermInYear, termKind.Value,
                body.WeeklyHours, body.TotalHours, body.Description);

            try
            {
                var result = await bus.InvokeAsync<Result<CreateSubjectResponse>>(command, ct);
                if (result.IsSuccess)
                {
                    return Results.Created(
                        $"/api/academic/career-plans/{planId}/subjects/{result.Value.Id}",
                        result.Value);
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
        .WithName("Academic_CreateSubject")
        .WithTags("Academic")
        .RequireAuthorization(p => p.RequireRole(AdminSubjectPolicy.RoleName))
        .Produces<CreateSubjectResponse>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }
}

/// <summary>
/// Body del POST. Code/name/yearInPlan/termKind/weeklyHours/totalHours requeridos; termInYear
/// (obligatorio salvo kind=Anual, lo valida el dominio) y description opcionales. TermKind viaja
/// como string (el endpoint lo parsea).
/// </summary>
public sealed record CreateSubjectRequest(
    string Code,
    string Name,
    int YearInPlan,
    int? TermInYear,
    string? TermKind,
    int WeeklyHours,
    int TotalHours,
    string? Description);
