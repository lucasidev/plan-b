using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Academic.Application.Contracts;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Domain.Reviews;

namespace Planb.Reviews.Application.Features.ChairsNearFloor;

/// <summary>
/// GET /api/reviews/careers/{careerId}/chairs-near-floor: las cátedras de las materias de esa
/// carrera con exactamente <c>PublishingRules.ChairMinimumReviews - 1</c> reseñas, a una de
/// publicar. Agregado público (lectura sin cuenta): el conteo nomás, nada de una cuenta.
///
/// <para>
/// Compone la identidad cruda de <see cref="IChairsNearFloorQueryService"/> (reviews, cross-schema
/// por career_id) con los nombres de <see cref="IAcademicQueryService.GetLabelsAsync"/>, pedidos en
/// lote (ADR-0087): el read de reviews nunca hace JOIN a academic solo para mostrar un nombre. Una
/// carrera sin ninguna cátedra en ese conteo devuelve lista vacía, no 404.
/// </para>
/// </summary>
public sealed class GetChairsNearFloorEndpoint : ICarterModule
{
    private const string Unknown = "Sin vincular";

    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/reviews/careers/{careerId:guid}/chairs-near-floor", async (
            Guid careerId,
            IChairsNearFloorQueryService nearFloor,
            IAcademicQueryService academic,
            CancellationToken ct) =>
        {
            var identities = await nearFloor.ListAsync(
                careerId, PublishingRules.ChairMinimumReviews - 1, ct);

            var labels = await academic.GetLabelsAsync(
                identities.Select(i => i.SubjectId).Distinct().ToArray(),
                [],
                identities.Select(i => i.ChairId).Distinct().ToArray(),
                ct);

            var views = identities
                .Select(i => new ChairNearFloorView(
                    i.ChairId,
                    labels.Chairs.GetValueOrDefault(i.ChairId) ?? Unknown,
                    i.SubjectId,
                    labels.Subjects.GetValueOrDefault(i.SubjectId)?.Name ?? Unknown,
                    i.ReviewCount))
                .ToList();

            return Results.Ok(views);
        })
        .WithName("Reviews_GetChairsNearFloor")
        .WithTags("Reviews")
        .AllowAnonymous()
        .Produces<IReadOnlyList<ChairNearFloorView>>(StatusCodes.Status200OK);
    }
}
