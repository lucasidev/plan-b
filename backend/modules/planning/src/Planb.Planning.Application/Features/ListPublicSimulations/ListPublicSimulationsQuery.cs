namespace Planb.Planning.Application.Features.ListPublicSimulations;

/// <summary>
/// Query de US-027 (feed público de simulaciones compartidas del mismo plan + término).
/// <see cref="Cursor"/> es opaco (null en la primera página): lo construye el propio endpoint a
/// partir del <c>NextCursor</c> de la página anterior.
/// </summary>
public sealed record ListPublicSimulationsQuery(
    Guid UserId, Guid CareerPlanId, Guid TermId, string? Cursor);
