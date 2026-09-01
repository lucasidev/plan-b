using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Domain.Reviews;

namespace Planb.Reviews.Application.Features.MyReviewedChairs;

/// <summary>
/// GET /api/reviews/chairs/mine (US-231): las cátedras que esta cuenta reseñó, con sus voces y si
/// publican.
///
/// <para>
/// La cuenta sale del token y nunca de un parámetro, igual que en
/// <c>/api/reviews/courses/me</c>: qué reseñó alguien es de ese alguien.
/// </para>
///
/// <para>
/// El piso y cuánto falta se resuelven acá y no en el SQL: la constante del dominio es la única
/// definición del piso, y el read cuenta sin decidir.
/// </para>
/// </summary>
public sealed class GetMyReviewedChairsEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/reviews/chairs/mine", async (
            HttpContext http,
            IMyReviewedChairsQueryService chairs,
            CancellationToken ct) =>
        {
            var userId = CurrentUser.RequireUserId(http);
            var tallies = await chairs.ListAsync(userId.Value, ct);

            var view = tallies
                .Select(c => new MyReviewedChairResponse(
                    c.ChairId,
                    c.ReviewCount,
                    c.ReviewCount >= PublishingRules.ChairMinimumReviews,
                    Math.Max(0, PublishingRules.ChairMinimumReviews - c.ReviewCount)))
                .ToList();

            return Results.Ok(view);
        })
        .WithName("Reviews_GetMyReviewedChairs")
        .WithTags("Reviews")
        .RequireAuthorization()
        .Produces<IReadOnlyList<MyReviewedChairResponse>>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized);
    }
}

/// <summary>
/// Una cátedra reseñada, con lo que Inicio necesita decir de ella.
/// <paramref name="ReviewsMissingToPublish"/> es 0 cuando ya publica, no un número negativo.
/// </summary>
public sealed record MyReviewedChairResponse(
    Guid ChairId,
    int ReviewCount,
    bool IsPublished,
    int ReviewsMissingToPublish);
