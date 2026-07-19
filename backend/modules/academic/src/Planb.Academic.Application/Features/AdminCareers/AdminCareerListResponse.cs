namespace Planb.Academic.Application.Features.AdminCareers;

/// <summary>Wrapper del listado admin de carreras de una universidad (US-061).</summary>
public sealed record AdminCareerListResponse(IReadOnlyList<AdminCareerListItem> Items);
