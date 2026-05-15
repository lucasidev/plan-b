namespace Planb.Enrollments.Application.Features.RegisterEnrollment;

public sealed record RegisterEnrollmentResponse(
    Guid Id,
    Guid StudentProfileId,
    Guid SubjectId,
    Guid? CommissionId,
    Guid? TermId,
    string Status,
    string? ApprovalMethod,
    decimal? Grade,
    DateTimeOffset CreatedAt);
