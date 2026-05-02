namespace Planb.Identity.Application.Features.CreateStudentProfile;

/// <summary>
/// HTTP body. UserId no viene aca: se infiere del JWT (ADR-0023). El endpoint extrae el sub
/// del token y arma el command con el UserId real.
/// </summary>
public sealed record CreateStudentProfileRequest(
    Guid CareerPlanId,
    int EnrollmentYear);
