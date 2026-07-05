namespace Planb.Academic.Application.Features.AdminTeachers;

/// <summary>
/// Edición de un docente del catálogo (US-063, admin). Es un replace del form completo: los nombres
/// van por <c>Rename</c> y title/bio/photoUrl por <c>UpdateProfile</c>. Semántica del aggregate:
/// string vacío limpia el campo, null lo deja como está (el form manda strings, vacío si en blanco).
/// </summary>
public sealed record UpdateTeacherCommand(
    Guid TeacherId,
    string FirstName,
    string LastName,
    string? Title,
    string? Bio,
    string? PhotoUrl);
