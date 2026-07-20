namespace Planb.Academic.Application.Features.AdminSubjects;

/// <summary>Wrapper del listado admin de materias de un plan de estudios (US-062).</summary>
public sealed record AdminSubjectListResponse(IReadOnlyList<AdminSubjectListItem> Items);
