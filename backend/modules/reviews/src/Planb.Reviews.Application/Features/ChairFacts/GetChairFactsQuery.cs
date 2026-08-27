namespace Planb.Reviews.Application.Features.ChairFacts;

/// <summary>
/// Pide la ficha de una cátedra. No lleva cuenta: leer no pide cuenta, producir sí (tesis,
/// decisión 3).
/// </summary>
public sealed record GetChairFactsQuery(Guid ChairId);
