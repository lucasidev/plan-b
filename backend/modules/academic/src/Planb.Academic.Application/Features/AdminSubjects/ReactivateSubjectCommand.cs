namespace Planb.Academic.Application.Features.AdminSubjects;

/// <summary>Revierte el soft delete de una materia (US-062, admin).</summary>
public sealed record ReactivateSubjectCommand(Guid SubjectId);
