namespace Planb.Academic.Application.Features.AdminCareers;

/// <summary>DTO del GET /api/academic/careers/{id} (admin). Shape plano para serializar HTTP.</summary>
public sealed record CareerDetailResponse(
    Guid Id,
    Guid UniversityId,
    string Name,
    string Slug,
    string? ShortName,
    string? Code,
    bool IsOfficial,
    bool IsActive);
