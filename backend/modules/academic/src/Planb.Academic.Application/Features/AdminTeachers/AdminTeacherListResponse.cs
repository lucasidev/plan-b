namespace Planb.Academic.Application.Features.AdminTeachers;

/// <summary>Wrapper del listado admin de docentes (US-063).</summary>
public sealed record AdminTeacherListResponse(IReadOnlyList<AdminTeacherListItem> Items);
