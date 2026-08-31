using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Reviews.Domain.CourseReviews;

namespace Planb.Reviews.Application.Features.PublishingRulesRead;

/// <summary>
/// GET /api/reviews/publishing-rules (US-130). Los pisos que gobiernan qué se publica.
///
/// <para>
/// Existe para que Método los diga sin escribirlos a mano. Un número de producto escrito en la
/// pantalla sería una segunda definición de la regla: cambiaríamos la constante y la pantalla
/// seguiría explicando la anterior, que es la peor forma de mentir porque suena a método.
/// </para>
///
/// <para>
/// Público y sin cuenta, como todo lo que Método publica: poder auditar el número no puede
/// depender de tener usuario (US-168).
/// </para>
/// </summary>
public sealed class GetPublishingRulesEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/reviews/publishing-rules", () =>
            Results.Ok(new PublishingRulesResponse(
                ChairMinimumReviews: PublishingRules.ChairMinimumReviews,
                SubjectPairMinimumReviews: PublishingRules.SubjectPairMinimumReviews)))
        .WithName("Reviews_GetPublishingRules")
        .WithTags("Reviews")
        .AllowAnonymous()
        .Produces<PublishingRulesResponse>(StatusCodes.Status200OK);
    }
}

/// <summary>
/// Los dos pisos. Son dos y no uno porque protegen cosas distintas: el de la cátedra, la privacidad
/// de quien reseña; el del par, que el número no diga más sobre quién se acordó de reseñar que
/// sobre la combinación.
/// </summary>
public sealed record PublishingRulesResponse(
    int ChairMinimumReviews,
    int SubjectPairMinimumReviews);
