namespace Planb.Academic.Application.Features.AdminTeachers;

/// <summary>Id del docente editado. El frontend refetchea la lista (ADR-0046).</summary>
public sealed record UpdateTeacherResponse(Guid Id);
