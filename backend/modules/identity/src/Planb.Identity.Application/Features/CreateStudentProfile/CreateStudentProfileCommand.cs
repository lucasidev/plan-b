using Planb.Identity.Domain.Users;

namespace Planb.Identity.Application.Features.CreateStudentProfile;

public sealed record CreateStudentProfileCommand(
    UserId UserId,
    Guid CareerPlanId,
    int EnrollmentYear);
