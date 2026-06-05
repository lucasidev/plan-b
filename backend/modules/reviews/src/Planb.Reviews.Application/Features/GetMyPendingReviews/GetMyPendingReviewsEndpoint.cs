using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Identity.Application.Contracts;
using Planb.Reviews.Application.Abstractions.Persistence;

namespace Planb.Reviews.Application.Features.GetMyPendingReviews;

/// <summary>
/// GET /api/reviews/me/pending (US-048).
///
/// Auth: JwtBearer extrae el <c>UserId</c>. Resolvemos el <c>StudentProfileId</c> activo del user
/// via <see cref="IIdentityQueryService"/>; si el user no tiene profile (todavía no completó
/// onboarding), devolvemos una lista vacía en lugar de 404. Es deliberado: cualquier user
/// autenticado puede pegarle al endpoint y obtener un payload válido aunque vacío, lo cual
/// simplifica el frontend (no tiene que branchear por error).
///
/// El listado en sí lo arma <see cref="IPendingReviewsQueryService"/> con un Dapper raw
/// cross-schema (ver doc en la interface).
/// </summary>
public sealed class GetMyPendingReviewsEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/reviews/me/pending", async (
            HttpContext http,
            IIdentityQueryService identity,
            IPendingReviewsQueryService pendingReviews,
            CancellationToken ct) =>
        {
            var userId = CurrentUser.RequireUserId(http);

            var profile = await identity.GetStudentProfileForUserAsync(userId.Value, ct);
            if (profile is null || !profile.IsActive)
            {
                return Results.Ok(new GetMyPendingReviewsResponse([]));
            }

            var items = await pendingReviews.GetForStudentAsync(profile.Id, ct);
            return Results.Ok(new GetMyPendingReviewsResponse(items));
        })
        .WithName("Reviews_GetMyPendingReviews")
        .WithTags("Reviews")
        .RequireAuthorization()
        .Produces<GetMyPendingReviewsResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized);
    }
}
