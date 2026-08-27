namespace Planb.Reviews.Application.Features.SubjectFacts;

/// <summary>
/// Pide la ficha de una materia. No lleva cuenta: leer no pide cuenta, producir sí.
/// </summary>
public sealed record GetSubjectFactsQuery(Guid SubjectId);
