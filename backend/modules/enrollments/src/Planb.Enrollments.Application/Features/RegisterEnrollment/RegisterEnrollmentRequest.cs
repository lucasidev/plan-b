namespace Planb.Enrollments.Application.Features.RegisterEnrollment;

/// <summary>
/// Body de <c>POST /api/me/enrollment-records</c>. El <c>userId</c> NO viene en el body:
/// se deriva del claim <c>sub</c> del JWT validado por <c>RequireAuthorization()</c>.
/// </summary>
public sealed record RegisterEnrollmentRequest(
    Guid SubjectId,
    Guid? CommissionId,
    Guid? TermId,
    string Status,
    string? ApprovalMethod,
    decimal? Grade);
