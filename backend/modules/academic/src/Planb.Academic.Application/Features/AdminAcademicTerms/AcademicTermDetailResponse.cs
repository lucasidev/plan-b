namespace Planb.Academic.Application.Features.AdminAcademicTerms;

/// <summary>
/// DTO del GET /api/academic/academic-terms/{id} (admin). Shape plano para serializar HTTP. Kind
/// sale serializado como string (<c>enum.ToString()</c>).
/// </summary>
public sealed record AcademicTermDetailResponse(
    Guid Id,
    Guid UniversityId,
    int Year,
    int Number,
    string Kind,
    DateOnly StartDate,
    DateOnly EndDate,
    DateTimeOffset EnrollmentOpens,
    DateTimeOffset EnrollmentCloses,
    string Label,
    DateTimeOffset CreatedAt);
