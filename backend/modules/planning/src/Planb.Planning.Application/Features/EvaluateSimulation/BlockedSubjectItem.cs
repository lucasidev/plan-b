namespace Planb.Planning.Application.Features.EvaluateSimulation;

/// <summary>
/// Materia del subset evaluado que está bloqueada, con el detalle de qué correlativa
/// <c>para_cursar</c> le falta (US-016). Mismo detalle que <c>blockedBy</c> en
/// GET /api/me/simulator/available: el AC pide que el alumno vea qué le falta, no solo que
/// la combinación no es viable.
/// </summary>
public sealed record BlockedSubjectItem(Guid Id, string Code, string Name, IReadOnlyList<SubjectRefItem> BlockedBy);
