using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Domain.Reviews;

namespace Planb.Reviews.Application.Features.PlanSubjectCoverage;

/// <summary>
/// GET /api/reviews/career-plans/{careerPlanId}/covered-subjects (US-134, V10): qué materias de un
/// plan ya tienen una cátedra que cruzó el piso de publicación.
///
/// <para>
/// Existe para que la lista pública de materias de un plan (US-001, <c>/plans/[id]/subjects</c>)
/// pueda marcar cuáles ya tienen ficha sin que Valentina tenga que entrar materia por materia: hoy
/// la única forma de ubicar la cobertura ("1 de 21") era esa.
/// </para>
///
/// <para>
/// Read simple sin command ni handler Wolverine (ADR-0018): no hay regla de dominio que decidir acá
/// más allá del piso, que ya es una constante. Un plan inexistente o sin materias medidas devuelve
/// lista vacía, no 404: es el mismo criterio que el resto del catálogo público (no encontrar nada es
/// una respuesta).
/// </para>
/// </summary>
public sealed class GetCoveredSubjectsEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/reviews/career-plans/{careerPlanId:guid}/covered-subjects", async (
            Guid careerPlanId,
            ICareerCoverageQueryService coverage,
            CancellationToken ct) =>
        {
            var subjectIds = await coverage.GetCoveredSubjectIdsAsync(
                careerPlanId, PublishingRules.ChairMinimumReviews, ct);
            return Results.Ok(subjectIds);
        })
        .WithName("Reviews_GetCoveredSubjects")
        .WithTags("Reviews")
        .AllowAnonymous()
        .Produces<IReadOnlyList<Guid>>(StatusCodes.Status200OK);
    }
}
