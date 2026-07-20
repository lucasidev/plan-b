namespace Planb.Planning.Application.Features.GetAvailableSubjects;

/// <summary>
/// GET /api/me/simulator/available (US-016). Materias del plan del alumno logueado con su
/// disponibilidad para el próximo cuatrimestre, evaluada contra su historial actual.
/// </summary>
public sealed record GetAvailableSubjectsQuery(Guid UserId);
