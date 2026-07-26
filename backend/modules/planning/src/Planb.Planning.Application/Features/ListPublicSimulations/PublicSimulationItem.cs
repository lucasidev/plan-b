namespace Planb.Planning.Application.Features.ListPublicSimulations;

/// <summary>
/// Simulación compartida al corpus público (US-027), anonimizada: nunca viaja el
/// <c>ownerProfileId</c> ni ningún otro dato del autor. Las métricas agregadas
/// (<see cref="TotalWeeklyHours"/>, <see cref="AverageDifficulty"/>) vienen pre-calculadas por el
/// servidor: el cliente no las recalcula.
///
/// <para>
/// <see cref="AverageDifficulty"/> es <c>null</c> cuando ninguna materia de la combinación tiene
/// todavía reseñas publicadas: "no sabemos" no es lo mismo que "fácil" (mismo criterio que
/// <c>EvaluateSimulationResponse.WeightedDifficulty</c>).
/// </para>
/// </summary>
public sealed record PublicSimulationItem(
    Guid Id,
    string? Label,
    Guid TermId,
    IReadOnlyList<PublicSimulationSubjectItem> Items,
    int TotalWeeklyHours,
    double? AverageDifficulty);
