using Planb.Academic.Application.Contracts;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Application.Features.ChairFacts;
using Planb.Reviews.Domain.Reviews;
using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Application.Features.SampleChairFacts;

/// <summary>
/// Arma la muestra de la entrada (US-221): sortea una cátedra entre las que ya publican y devuelve
/// su ficha, la misma que sirve <c>GET /api/reviews/chairs/{id}/facts</c>.
///
/// <para>
/// Devuelve exactamente la ficha y no un resumen armado para la landing. Que la entrada muestre lo
/// mismo que la pantalla a la que lleva es el punto entero de la story: alguien que llega tiene que
/// ver el instrumento funcionando, no una vitrina hecha aparte que después no se parece a nada.
/// </para>
///
/// <para>
/// El sorteo pasa por el piso de publicación y no por el valor de ningún conteo. Elegir la peor
/// sería usar el producto para acusar, y elegir la mejor sería usarlo para vender; las dos cosas
/// las prohíbe US-171, y las dos convertirían la muestra en un argumento en vez de un ejemplo.
/// </para>
/// </summary>
public static class GetSampleChairFactsQueryHandler
{
    public static async Task<Result<GetChairFactsResponse>> Handle(
        GetSampleChairFactsQuery query,
        IAcademicQueryService academic,
        IChairTallyQueryService tallies,
        CancellationToken ct)
    {
        var chairId = await tallies.PickPublishingChairAsync(
            PublishingRules.ChairMinimumReviews, ct);

        if (chairId is null)
        {
            return SampleChairFactsErrors.NothingPublishesYet;
        }

        // Se delega a la ficha real en vez de repetir su armado. Si la muestra calculara lo suyo,
        // podría empezar a decir algo distinto de lo que dice la ficha a la que lleva, y ese drift
        // no lo notaría nadie hasta que un lector comparara las dos pantallas.
        return await GetChairFactsQueryHandler.Handle(
            new GetChairFactsQuery(chairId.Value), academic, tallies, ct);
    }
}

/// <summary>
/// El único error posible: todavía ninguna cátedra cruzó el piso, así que no hay ficha honesta que
/// mostrar. No es una falla: es el estado real de un producto que recién empieza a juntar voces, y
/// la entrada tiene que poder decirlo en vez de inventar un ejemplo.
/// </summary>
public static class SampleChairFactsErrors
{
    public static readonly Error NothingPublishesYet =
        Error.NotFound(
            "reviews.sample_chair_facts.nothing_publishes_yet",
            "No chair has reached the publishing floor yet.");
}
