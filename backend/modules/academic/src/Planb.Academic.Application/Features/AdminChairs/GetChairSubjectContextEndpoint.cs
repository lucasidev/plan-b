using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Planb.Academic.Application.Features.AdminChairs;

public sealed class GetChairSubjectContextEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/academic/chairs/subject-context", async (
            Guid subjectId, IAdminChairReader chairs, CancellationToken ct) =>
        {
            var context = await chairs.GetSubjectContextAsync(subjectId, ct);
            return context is null ? Results.NotFound() : Results.Ok(context);
        })
        .WithName("Academic_GetChairSubjectContext")
        .WithTags("Academic")
        .RequireAuthorization(p => p.RequireRole(AdminChairPolicy.RoleName))
        .Produces<ChairSubjectContext>()
        .Produces(StatusCodes.Status404NotFound);
    }
}
