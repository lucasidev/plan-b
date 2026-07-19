namespace Planb.Academic.Application.Features.AdminCareerPlans;

/// <summary>Wrapper del listado admin de planes de estudio de una carrera (US-061).</summary>
public sealed record AdminCareerPlanListResponse(IReadOnlyList<AdminCareerPlanListItem> Items);
