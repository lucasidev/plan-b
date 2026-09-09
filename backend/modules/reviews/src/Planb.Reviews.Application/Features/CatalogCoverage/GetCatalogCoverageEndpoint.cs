using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Academic.Application.Contracts;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Domain.Reviews;

namespace Planb.Reviews.Application.Features.CatalogCoverage;

/// <summary>
/// GET /api/reviews/catalog-coverage (US-222, ficha de SC-003): la cobertura, las voces y la
/// presencia de datos oficiales de TODAS las carreras del catálogo, en una cantidad fija de
/// consultas (no una por carrera). Es lo que le faltaba a Explorar para decir, antes del clic,
/// dónde hay algo para leer: hoy solo se sabía entrando carrera por carrera.
///
/// <para>
/// Compone identidad de academic (<see cref="IAcademicQueryService.ListAllCareersAsync"/>) con lo
/// que reviews deriva (<see cref="ICareerCoverageQueryService.GetCoverageBatchAsync"/>) y con la
/// presencia de datos oficiales, también de academic (ADR-0090). Read directo vía las dos
/// interfaces (mismo patrón que <c>ListUniversitiesEndpoint</c>): no hay una falla de negocio que
/// representar, un catálogo vacío es una lista vacía, no un error.
/// </para>
/// </summary>
public sealed class GetCatalogCoverageEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/reviews/catalog-coverage", async (
            IAcademicQueryService academic,
            ICareerCoverageQueryService coverage,
            CancellationToken ct) =>
        {
            var careers = await academic.ListAllCareersAsync(ct);
            var careerIds = careers.Select(c => c.Id).ToList();

            var coverageByCareer = await coverage.GetCoverageBatchAsync(
                careerIds, PublishingRules.ChairMinimumReviews, ct);
            var withOfficialData = await academic.ListCareersWithOfficialDataAsync(careerIds, ct);

            var views = careers
                .Select(c =>
                {
                    coverageByCareer.TryGetValue(c.Id, out var counted);
                    return new CareerCoverageView(
                        c.Id,
                        c.Name,
                        c.UniversityId,
                        c.UniversityName,
                        c.IsOfficial,
                        HasOfficialData: withOfficialData.Contains(c.Id),
                        VoiceCount: counted?.VoiceCount ?? 0,
                        TotalSubjects: counted?.TotalSubjects ?? 0,
                        CoveredSubjects: counted?.CoveredSubjects ?? 0);
                })
                .ToList();

            return Results.Ok(new GetCatalogCoverageResponse(views));
        })
        .WithName("Reviews_GetCatalogCoverage")
        .WithTags("Reviews")
        .AllowAnonymous()
        .Produces<GetCatalogCoverageResponse>(StatusCodes.Status200OK);
    }
}
