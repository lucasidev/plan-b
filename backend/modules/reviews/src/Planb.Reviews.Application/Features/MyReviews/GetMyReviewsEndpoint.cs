using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Academic.Application.Contracts;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Reviews.Application.Abstractions.Persistence;

namespace Planb.Reviews.Application.Features.MyReviews;

/// <summary>
/// GET /api/reviews/courses/me (US-165, US-166): lo que esta cuenta aportó.
///
/// <para>
/// Es el único read del producto que devuelve reseñas de a una, y por eso la cuenta sale del token
/// y nunca de un parámetro: si aceptara un accountId, cualquiera podría leer lo que reseñó otro, y
/// eso es exactamente lo que el anonimato promete que no pasa.
/// </para>
/// </summary>
public sealed class GetMyReviewsEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/reviews/courses/me", async (
            HttpContext http,
            IMyReviewsQueryService reviews,
            IAcademicQueryService academic,
            CancellationToken ct) =>
        {
            var userId = CurrentUser.RequireUserId(http);
            var mine = await GetMyReviewsQueryHandler.Handle(
                userId.Value, reviews, academic, ct);
            return Results.Ok(mine);
        })
        .WithName("Reviews_GetMyReviews")
        .WithTags("Reviews")
        .RequireAuthorization()
        .Produces<IReadOnlyList<MyReviewView>>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized);
    }
}
