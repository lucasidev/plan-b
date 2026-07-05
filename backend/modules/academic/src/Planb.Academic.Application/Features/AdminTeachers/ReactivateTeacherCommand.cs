namespace Planb.Academic.Application.Features.AdminTeachers;

/// <summary>Revierte el soft delete de un docente (US-063, admin).</summary>
public sealed record ReactivateTeacherCommand(Guid TeacherId);
