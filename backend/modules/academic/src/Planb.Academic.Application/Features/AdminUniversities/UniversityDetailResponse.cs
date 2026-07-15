namespace Planb.Academic.Application.Features.AdminUniversities;

/// <summary>DTO del GET /api/academic/universities/{id} (admin). Shape plano para serializar HTTP.</summary>
public sealed record UniversityDetailResponse(
    Guid Id,
    string Name,
    string Slug,
    IReadOnlyList<string> InstitutionalEmailDomains,
    bool IsActive);
