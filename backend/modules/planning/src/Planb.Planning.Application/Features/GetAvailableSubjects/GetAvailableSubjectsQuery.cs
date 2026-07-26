namespace Planb.Planning.Application.Features.GetAvailableSubjects;

/// <summary>
/// GET /api/me/simulator/available (US-016). Materias del plan del alumno logueado con su
/// disponibilidad para el próximo cuatrimestre, evaluada contra su historial actual.
///
/// <para>
/// <see cref="TermId"/> es opcional (US-096): sin él, cada item viaja con <c>Commissions: []</c>
/// (comportamiento idéntico al de antes de US-096). Con él, cada item suma la oferta de comisiones
/// activas de ese término para esa materia (docentes + horario), insumo para elegir comisión y ver
/// choques en el planificador (POST /api/me/simulator/evaluate).
/// </para>
/// </summary>
public sealed record GetAvailableSubjectsQuery(Guid UserId, Guid? TermId);
