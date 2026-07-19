namespace Planb.Academic.Application.Features.AdminCareers;

/// <summary>Soft delete de una carrera (US-061, admin). Preserva career plans / subjects anclados al id.</summary>
public sealed record DeactivateCareerCommand(Guid CareerId);
