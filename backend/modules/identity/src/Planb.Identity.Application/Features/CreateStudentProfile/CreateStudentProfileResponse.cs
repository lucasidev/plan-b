namespace Planb.Identity.Application.Features.CreateStudentProfile;

public sealed record CreateStudentProfileResponse(
    Guid Id,
    Guid CareerPlanId,
    int EnrollmentYear,
    string Status);
