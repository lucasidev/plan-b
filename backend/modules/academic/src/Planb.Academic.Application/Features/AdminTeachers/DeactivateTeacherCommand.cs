namespace Planb.Academic.Application.Features.AdminTeachers;

/// <summary>Soft delete de un docente (US-063, admin). Preserva las reseñas ancladas al id.</summary>
public sealed record DeactivateTeacherCommand(Guid TeacherId);
