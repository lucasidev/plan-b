namespace Planb.Academic.Application.Features.AdminCareerPlans;

/// <summary>Estado del plan tras un toggle (deprecate / reactivate).</summary>
public sealed record CareerPlanStatusResponse(Guid Id, string Status);
