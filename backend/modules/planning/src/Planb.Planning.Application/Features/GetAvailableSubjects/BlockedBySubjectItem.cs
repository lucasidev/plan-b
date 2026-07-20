namespace Planb.Planning.Application.Features.GetAvailableSubjects;

/// <summary>
/// Una correlativa para_cursar que al alumno todavía le falta (US-016). Trae code y name además del
/// id: el AC pide que el alumno vea qué materia le falta, y un UUID solo no le sirve para eso.
/// </summary>
public sealed record BlockedBySubjectItem(Guid Id, string Code, string Name);
