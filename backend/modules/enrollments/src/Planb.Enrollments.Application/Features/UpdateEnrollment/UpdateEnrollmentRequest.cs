namespace Planb.Enrollments.Application.Features.UpdateEnrollment;

/// <summary>
/// Body de <c>PATCH /api/me/enrollment-records/{id}</c>. Ni el <c>userId</c> ni el <c>subjectId</c>
/// viajan: el primero se deriva del claim <c>sub</c> del JWT, y el segundo no se puede cambiar (ver
/// <see cref="UpdateEnrollmentCommand"/>).
///
/// Los cinco campos van completos, no como delta. La razón está en el docstring del command.
/// </summary>
public sealed record UpdateEnrollmentRequest(
    Guid? CommissionId,
    Guid? TermId,
    string Status,
    string? ApprovalMethod,
    decimal? Grade);
