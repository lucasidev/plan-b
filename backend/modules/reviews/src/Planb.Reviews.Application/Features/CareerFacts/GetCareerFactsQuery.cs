namespace Planb.Reviews.Application.Features.CareerFacts;

/// <summary>
/// Pide la ficha de una carrera. No lleva cuenta: leer no pide cuenta, producir sí.
/// </summary>
public sealed record GetCareerFactsQuery(Guid CareerId);
