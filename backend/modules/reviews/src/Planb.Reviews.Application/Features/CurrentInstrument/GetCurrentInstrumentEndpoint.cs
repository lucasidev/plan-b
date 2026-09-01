using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Domain.Reviews;

namespace Planb.Reviews.Application.Features.CurrentInstrument;

/// <summary>
/// GET /api/reviews/instrument (US-146): el cuestionario que se ofrece hoy, con sus ítems y
/// opciones en orden.
///
/// <para>
/// Público y sin cuenta: ver qué se pregunta es parte de saber en qué te estás metiendo, y el
/// método publica el catálogo entero igual. La cuenta la pide responder, no mirar.
/// </para>
///
/// <para>
/// Devuelve 404 cuando el cuestionario todavía no se publicó, que en un entorno sano no pasa: sin
/// instrumento vigente no hay producto. Es una condición de catálogo vacío, no del pedido.
/// </para>
/// </summary>
public sealed class GetCurrentInstrumentEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/reviews/instrument", async (
            ICurrentInstrumentQueryService instruments,
            CancellationToken ct) =>
        {
            var current = await instruments.GetCurrentAsync(
                PublishingRules.CourseInstrumentCode, ct);

            return current is null
                ? Results.Problem(
                    title: "reviews.instrument.not_published",
                    detail: "The course questionnaire has not been published yet.",
                    statusCode: StatusCodes.Status404NotFound)
                : Results.Ok(current);
        })
        .WithName("Reviews_GetCurrentInstrument")
        .WithTags("Reviews")
        .AllowAnonymous()
        .Produces<CurrentInstrumentView>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
