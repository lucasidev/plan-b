namespace Planb.Academic.Application.Features.AdminCareerPlans;

/// <summary>Archiva un plan de estudios (US-061, admin): pasa de Active a Deprecated.</summary>
public sealed record DeprecateCareerPlanCommand(Guid CareerPlanId);
