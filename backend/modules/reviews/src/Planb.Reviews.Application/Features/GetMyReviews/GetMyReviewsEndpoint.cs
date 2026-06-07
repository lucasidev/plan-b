using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Identity.Application.Contracts;
using Planb.Reviews.Application.Abstractions.Persistence;

namespace Planb.Reviews.Application.Features.GetMyReviews;

/// <summary>
/// GET /api/reviews/me (US-048 tab Mías).
///
/// Returns the reviews published by the authenticated student plus a small stats block
/// used by the frontend to render the "X publicadas" header. If the user has no profile
/// (no onboarding yet) or the profile is inactive, the endpoint returns an empty payload
/// (200 OK, items=[], stats=zeroes) so the frontend does not have to branch on errors.
/// </summary>
public sealed class GetMyReviewsEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/reviews/me", async (
            HttpContext http,
            IIdentityQueryService identity,
            IMyReviewsQueryService myReviews,
            CancellationToken ct) =>
        {
            var userId = CurrentUser.RequireUserId(http);

            var profile = await identity.GetStudentProfileForUserAsync(userId.Value, ct);
            if (profile is null || !profile.IsActive)
            {
                return Results.Ok(new GetMyReviewsResponse([], new MyReviewsStats(0, 0, 0, 0)));
            }

            var response = await myReviews.GetForStudentAsync(profile.Id, ct);
            return Results.Ok(response);
        })
        .WithName("Reviews_GetMyReviews")
        .WithTags("Reviews")
        .RequireAuthorization()
        .Produces<GetMyReviewsResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized);
    }
}
