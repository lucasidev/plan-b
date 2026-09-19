namespace Planb.Academic.Application.Features.AdminUniversities;

public sealed record UpdateUniversityProfileCommand(
    Guid UniversityId,
    string? WebsiteUrl,
    string? Address,
    string? Province,
    string? LocalityText);
