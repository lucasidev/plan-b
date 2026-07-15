namespace Planb.Academic.Application.Features.AdminUniversities;

/// <summary>Soft delete de una universidad (US-060, admin). Preserva careers/teachers anclados al id.</summary>
public sealed record DeactivateUniversityCommand(Guid UniversityId);
