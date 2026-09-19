using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Planb.Academic.Application.Features.UniversityProfile;

public sealed class GetUniversityProfileEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/academic/universities/{id:guid}/profile", async (Guid id, IUniversityProfileReader reader, CancellationToken ct) =>
        {
            var profile = await reader.GetAsync(id, ct);
            return profile is null ? Results.NotFound() : Results.Ok(profile);
        }).WithName("Academic_GetUniversityProfile").WithTags("Academic").AllowAnonymous();

        app.MapGet("/api/academic/universities/{id:guid}/logo", async (Guid id, HttpResponse response, IUniversityProfileReader reader, CancellationToken ct) =>
        {
            var logo = await reader.GetLogoAsync(id, ct);
            response.Headers.XContentTypeOptions = "nosniff";
            return logo is null ? Results.NotFound() : Results.File(logo, "image/png", enableRangeProcessing: false, lastModified: null, entityTag: null);
        }).WithName("Academic_GetUniversityLogo").WithTags("Academic").AllowAnonymous();
    }
}
