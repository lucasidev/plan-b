namespace Planb.Academic.Application.Features.AdminChairs;

/// <summary>
/// Cierra el tramo de un docente en una cátedra, en un período (US-196). <b>Nadie se borra</b>: lo
/// que dictó sigue siendo cierto, y borrarlo haría que las reseñas de esos períodos quedaran
/// atribuidas a quien vino después.
/// </summary>
public sealed record CloseChairMemberCommand(Guid ChairId, Guid TeacherId, Guid UntilTermId);
