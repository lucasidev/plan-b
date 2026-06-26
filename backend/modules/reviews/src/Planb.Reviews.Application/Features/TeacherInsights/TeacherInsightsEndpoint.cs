using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Reviews.Application.Abstractions.Persistence;

namespace Planb.Reviews.Application.Features.TeacherInsights;

/// <summary>
/// GET /api/reviews/teacher-insights?teacherId={id} (US-003). Crowd insights agregados de un
/// docente. Público (el corpus es el producto). Sin <c>teacherId</c> devuelve 400.
///
/// Siempre 200 cuando hay teacherId: un docente sin reseñas (o un id inexistente) devuelve el
/// agregado vacío (count 0, promedios null, histograma en cero), no 404. La existencia del docente
/// la decide la página vía GET /api/academic/teachers/{id}; este endpoint solo agrega reseñas.
/// </summary>
public sealed class TeacherInsightsEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/reviews/teacher-insights", async (
            Guid? teacherId,
            ITeacherInsightsQueryService insights,
            CancellationToken ct) =>
        {
            if (teacherId is null || teacherId == Guid.Empty)
            {
                return Results.Problem(
                    title: "reviews.teacher_insights.missing_teacher_id",
                    detail: "teacherId query parameter is required.",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            var result = await insights.GetForTeacherAsync(teacherId.Value, ct);
            return Results.Ok(result);
        })
        .WithName("Reviews_TeacherInsights")
        .WithTags("Reviews")
        .AllowAnonymous()
        .Produces<TeacherReviewInsights>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest);
    }
}
