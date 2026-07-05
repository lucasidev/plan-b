namespace Planb.Academic.Application.Features.AdminTeachers;

/// <summary>
/// Alta de un docente del catálogo (US-063, admin). El aggregate normaliza los nombres a lowercase
/// (storage) y trimmea los opcionales; el display en title case lo resuelve la presentation layer.
/// </summary>
public sealed record CreateTeacherCommand(
    Guid UniversityId,
    string FirstName,
    string LastName,
    string? Title,
    string? Bio,
    string? PhotoUrl);
