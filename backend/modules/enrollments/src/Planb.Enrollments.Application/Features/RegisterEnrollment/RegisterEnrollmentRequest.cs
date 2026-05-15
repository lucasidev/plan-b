namespace Planb.Enrollments.Application.Features.RegisterEnrollment;

/// <summary>
/// Body del HTTP POST /api/me/enrollment-records. Mientras no haya JwtBearer middleware,
/// <c>UserId</c> viaja explícito en el body (mismo workaround que CreateStudentProfile).
/// </summary>
public sealed record RegisterEnrollmentRequest(
    Guid UserId,
    Guid SubjectId,
    Guid? CommissionId,
    Guid? TermId,
    string Status,
    string? ApprovalMethod,
    decimal? Grade);
