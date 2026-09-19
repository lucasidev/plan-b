namespace Planb.Academic.Application.Features.UniversityProfile;

public sealed record UniversityProfileResponse(
    Guid UniversityId, string Name, string Slug, string? WebsiteUrl, string? Address, string? Province,
    string? LocalityId, string? LocalityName, int? LogoVersion, int AcademicUnitCount, int CareerCount,
    int PlanCount, IReadOnlyList<UniversityProfileUnit> Units);

public sealed record UniversityProfileUnit(Guid Id, string Name, string Slug, string Address,
    string? Province, string? LocalityId, string? LocalityName, int CareerCount);
