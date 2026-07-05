namespace Planb.Academic.Application.Features.AdminTeachers;

/// <summary>Id del docente recién creado. El frontend refetchea la lista (ADR-0046).</summary>
public sealed record CreateTeacherResponse(Guid Id);
