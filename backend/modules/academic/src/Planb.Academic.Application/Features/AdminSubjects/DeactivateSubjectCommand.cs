namespace Planb.Academic.Application.Features.AdminSubjects;

/// <summary>
/// Soft delete de una materia (US-062, admin). Preserva EnrollmentRecord/Review/Commission anclados
/// al id sin FK cross-schema (ADR-0017).
/// </summary>
public sealed record DeactivateSubjectCommand(Guid SubjectId);
