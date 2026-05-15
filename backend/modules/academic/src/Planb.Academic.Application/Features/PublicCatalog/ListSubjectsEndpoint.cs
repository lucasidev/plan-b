using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Academic.Application.Contracts;

namespace Planb.Academic.Application.Features.PublicCatalog;

/// <summary>
/// GET /api/academic/subjects?careerPlanId={id} — listado de materias de un plan.
///
/// Caller: select de materias en el form de cargar historial (US-013-f). El alumno ya tiene su
/// <see cref="careerPlanId"/> derivado de su <c>StudentProfile</c>, así que el endpoint asume
/// caller informado.
///
/// Misma convención de errores que <see cref="ListCareersEndpoint"/>: id faltante o vacío → 400,
/// id inexistente → 200 con lista vacía.
/// </summary>
public sealed class ListSubjectsEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/academic/subjects", async (
            Guid? careerPlanId,
            IAcademicQueryService queries,
            CancellationToken ct) =>
        {
            if (careerPlanId is null || careerPlanId == Guid.Empty)
            {
                return Results.Problem(
                    title: "academic.subjects.missing_career_plan_id",
                    detail: "careerPlanId query parameter is required.",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            var subjects = await queries.ListSubjectsByCareerPlanAsync(careerPlanId.Value, ct);
            return Results.Ok(subjects);
        })
        .WithName("Academic_ListSubjects")
        .WithTags("Academic")
        .Produces<IReadOnlyList<SubjectListItem>>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .AllowAnonymous();
    }
}
