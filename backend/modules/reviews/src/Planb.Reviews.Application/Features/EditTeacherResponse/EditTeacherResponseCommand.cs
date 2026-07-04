namespace Planb.Reviews.Application.Features.EditTeacherResponse;

/// <summary>
/// US-041: el docente (<see cref="UserId"/>, del JWT) edita el texto de su respuesta a la reseña
/// <see cref="ReviewId"/>.
/// </summary>
public sealed record EditTeacherResponseCommand(Guid ReviewId, Guid UserId, string Text);
