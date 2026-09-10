namespace Planb.Identity.Application.Features.CreateStudentProfile;

public sealed record CreateStudentProfileResponse(
    Guid Id,
    // Este flow (POST /api/me/student-profiles) sigue exigiendo un plan real via
    // CreateStudentProfileValidator; el tipo es nullable acá solo porque StudentProfile.CareerPlanId
    // lo es a nivel dominio (otras carreras del catálogo no tienen plan relevado todavía).
    Guid? CareerPlanId,
    int? EnrollmentYear,
    string Status);
