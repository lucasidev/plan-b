using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Academic.Application.Contracts;

namespace Planb.Academic.Application.Features.PublicCatalog;

/// <summary>
/// GET /api/academic/careers?universityId={id} — listado público de carreras de una universidad.
///
/// Caller: dropdown 2 de la cascada del onboarding (US-037), después de elegir Universidad.
///
/// Convención: si <c>universityId</c> falta o no parsea como Guid, devolvemos 400. Si parsea
/// pero no existe en DB, devolvemos lista vacía (no 404) — explicado en
/// <see cref="IAcademicQueryService.ListCareersByUniversityAsync"/>: el caller ya tiene el id
/// del dropdown previo, una uni inválida es input adversarial.
/// </summary>
public sealed class ListCareersEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/academic/careers", async (
            Guid? universityId,
            IAcademicQueryService queries,
            CancellationToken ct) =>
        {
            if (universityId is null || universityId == Guid.Empty)
            {
                return Results.Problem(
                    title: "academic.careers.missing_university_id",
                    detail: "universityId query parameter is required.",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            var careers = await queries.ListCareersByUniversityAsync(universityId.Value, ct);
            return Results.Ok(careers);
        })
        .WithName("Academic_ListCareers")
        .WithTags("Academic")
        .Produces<IReadOnlyList<CareerListItem>>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .AllowAnonymous();
    }
}
