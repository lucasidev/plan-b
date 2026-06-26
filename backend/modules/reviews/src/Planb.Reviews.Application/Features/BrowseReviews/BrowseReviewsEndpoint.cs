using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Reviews.Application.Abstractions.Persistence;

namespace Planb.Reviews.Application.Features.BrowseReviews;

/// <summary>
/// GET /api/reviews (US-048 tab Explorar). Public feed of Published reviews. No
/// authentication required: the corpus is the product itself, the whole point is to let
/// any visitor browse it.
///
/// Pagination is bounded server-side: page defaults to 1, pageSize defaults to 20, and
/// pageSize is capped at 50 regardless of what the client asks. This prevents enumeration
/// attacks (mass scraping in one request) and keeps the Dapper query light.
/// </summary>
public sealed class BrowseReviewsEndpoint : ICarterModule
{
    private const int DefaultPageSize = 20;
    private const int MaxPageSize = 50;

    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/reviews", async (
            Guid? subjectId,
            Guid? careerPlanId,
            int? difficulty,
            Guid? teacherId,
            int? page,
            int? pageSize,
            HttpContext http,
            IBrowseReviewsQueryService browse,
            CancellationToken ct) =>
        {
            // Endpoint público: el caller puede ser anónimo. Si trae sesión, resolvemos su id
            // solo para marcar "mi voto" por reseña (no filtra el feed).
            var currentUserId = CurrentUser.GetUserId(http)?.Value;

            var query = new BrowseReviewsQuery(
                SubjectId: subjectId,
                CareerPlanId: careerPlanId,
                DifficultyRating: difficulty is >= 1 and <= 5 ? difficulty : null,
                TeacherId: teacherId,
                Page: Math.Max(1, page ?? 1),
                PageSize: Math.Clamp(pageSize ?? DefaultPageSize, 1, MaxPageSize),
                CurrentUserId: currentUserId);

            var response = await browse.BrowseAsync(query, ct);
            return Results.Ok(response);
        })
        .WithName("Reviews_BrowseReviews")
        .WithTags("Reviews")
        .AllowAnonymous()
        .Produces<BrowseReviewsResponse>(StatusCodes.Status200OK);
    }
}
