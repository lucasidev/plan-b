namespace Planb.Academic.Application.Features.AdminCareers;

/// <summary>
/// DTO del GET /api/academic/careers/{id} (admin). Shape plano para serializar HTTP. DegreeType y
/// Modality salen serializados como string (<c>enum.ToString()</c>).
/// </summary>
public sealed record CareerDetailResponse(
    Guid Id,
    Guid UniversityId,
    string Name,
    string Slug,
    string? ShortName,
    string? Code,
    string? DegreeType,
    int? DurationYears,
    string? Modality,
    string? Description,
    bool IsOfficial,
    bool IsActive);
