using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Academic.Application.Contracts;

namespace Planb.Academic.Application.Features.PublicCatalog;

/// <summary>
/// GET /api/academic/career-plans/{id} — devuelve el <see cref="CareerPlanSummary"/> de un plan.
///
/// Caller: el frontend de US-013-f que necesita resolver el <c>universityId</c> a partir del
/// <c>careerPlanId</c> del student (para pedir los <c>academic-terms</c> filtrados por uni).
/// Identity ya tiene el <c>careerPlanId</c> en el <c>StudentProfile</c>, pero no expone el
/// <c>universityId</c> en su response. Antes que cargar Identity con un JOIN cross-schema
/// (prohibido por ADR-0017), exponemos esta lookup en Academic.
/// </summary>
public sealed class GetCareerPlanByIdEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/academic/career-plans/{id:guid}", async (
            Guid id,
            IAcademicQueryService queries,
            CancellationToken ct) =>
        {
            if (id == Guid.Empty)
            {
                return Results.Problem(
                    title: "academic.career_plans.invalid_id",
                    detail: "career-plan id must be a non-empty GUID.",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            var summary = await queries.GetCareerPlanByIdAsync(id, ct);
            if (summary is null)
            {
                return Results.Problem(
                    title: "academic.career_plan.not_found",
                    detail: "No career plan with that id.",
                    statusCode: StatusCodes.Status404NotFound);
            }

            return Results.Ok(summary);
        })
        .WithName("Academic_GetCareerPlanById")
        .WithTags("Academic")
        .Produces<CareerPlanSummary>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .AllowAnonymous();
    }
}
