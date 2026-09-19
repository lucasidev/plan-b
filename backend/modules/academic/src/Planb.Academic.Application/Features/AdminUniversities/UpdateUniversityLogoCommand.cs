namespace Planb.Academic.Application.Features.AdminUniversities;

public sealed record UpdateUniversityLogoCommand(Guid UniversityId, byte[] Logo);
