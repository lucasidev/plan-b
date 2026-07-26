namespace Planb.Planning.Application.Features.ListPublicSimulations;

/// <summary>
/// Fila intermedia entre <see cref="Planb.Planning.Application.Abstractions.Persistence.IPublicSimulationsReader"/>
/// y el handler (US-027): trae todo lo de <see cref="PublicSimulationItem"/> más
/// <see cref="SharedAt"/>, que no viaja al cliente pero que el handler necesita para construir el
/// cursor de la próxima página (keyset pagination por <c>shared_at DESC</c>).
/// </summary>
public sealed record PublicSimulationDraftRow(
    Guid Id,
    string? Label,
    IReadOnlyList<PublicSimulationSubjectItem> Items,
    int TotalWeeklyHours,
    double? AverageDifficulty,
    DateTimeOffset SharedAt);
