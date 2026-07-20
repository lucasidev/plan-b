using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Academic.Application.Features.AdminSubjects;

/// <summary>
/// DELETE /api/academic/subjects/{id:guid} (admin, US-062). Soft delete: preserva la integridad
/// histórica (EnrollmentRecord/Review/Commission anclan al id sin FK cross-schema, ADR-0017).
///
/// <para>
/// A diferencia del resto del CRUD admin de Academic (Career/AcademicTerm/CareerPlan), acá el 409
/// no es un <c>Results.Problem</c> genérico: si otras materias declaran a esta como correlativa, el
/// body trae además el listado de esas materias (<c>{ code, dependents: [...] }</c>) para que el
/// backoffice pueda linkearlas y guiar al admin a reasignarlas. Gateado a rol Admin.
/// </para>
/// </summary>
public sealed class DeactivateSubjectEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapDelete("/api/academic/subjects/{id:guid}", async (
            Guid id,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            if (id == Guid.Empty)
            {
                return Results.Problem(
                    title: "academic.subject.not_found",
                    detail: "Subject not found.",
                    statusCode: StatusCodes.Status404NotFound);
            }

            var result = await bus.InvokeAsync<Result<DeactivateSubjectResponse>>(
                new DeactivateSubjectCommand(id), ct);
            if (result.IsFailure)
            {
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

            if (!result.Value.Deactivated)
            {
                return Results.Json(
                    new SubjectHasDependentsBody(result.Value.Code!, result.Value.Dependents),
                    statusCode: StatusCodes.Status409Conflict);
            }

            return Results.NoContent();
        })
        .WithName("Academic_DeactivateSubject")
        .WithTags("Academic")
        .RequireAuthorization(p => p.RequireRole(AdminSubjectPolicy.RoleName))
        .Produces(StatusCodes.Status204NoContent)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .Produces<SubjectHasDependentsBody>(StatusCodes.Status409Conflict);
    }
}

/// <summary>Body del 409 cuando otras materias declaran a esta como correlativa.</summary>
public sealed record SubjectHasDependentsBody(string Code, IReadOnlyList<SubjectDependentItem> Dependents);
