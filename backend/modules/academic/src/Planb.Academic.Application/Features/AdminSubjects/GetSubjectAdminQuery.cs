namespace Planb.Academic.Application.Features.AdminSubjects;

/// <summary>Detalle admin de una materia por id, scoped a un plan (US-062).</summary>
public sealed record GetSubjectAdminQuery(Guid CareerPlanId, Guid SubjectId);
