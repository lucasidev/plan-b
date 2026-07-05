namespace Planb.Academic.Application.Features.AdminTeachers;

/// <summary>Estado activo del docente tras un toggle (deactivate / reactivate).</summary>
public sealed record TeacherStatusResponse(Guid Id, bool IsActive);
