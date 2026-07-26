namespace Planb.Planning.Application.Features.ListPublicSimulations;

/// <summary>
/// Respuesta del GET /api/simulations/public (US-027). <see cref="NextCursor"/> es null cuando no
/// hay más páginas; si no, es el cursor opaco que el caller reenvía tal cual en <c>?cursor=</c>.
/// </summary>
public sealed record ListPublicSimulationsResponse(
    IReadOnlyList<PublicSimulationItem> Items,
    string? NextCursor);
