namespace Planb.Academic.Application.Features.AdminTeachers;

/// <summary>
/// Alta de un docente del catálogo (US-063, admin). El aggregate trimmea nombres y campos
/// opcionales.
/// </summary>
public sealed record CreateTeacherCommand(
    Guid UniversityId,
    string FirstName,
    string LastName,
    string? Title,
    string? Bio,
    string? PhotoUrl);
