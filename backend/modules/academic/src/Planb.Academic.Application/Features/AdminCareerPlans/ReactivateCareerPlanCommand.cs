namespace Planb.Academic.Application.Features.AdminCareerPlans;

/// <summary>Reactiva un plan de estudios archivado (US-061, admin): Deprecated a Active.</summary>
public sealed record ReactivateCareerPlanCommand(Guid CareerPlanId);
