namespace Planb.Academic.Application.Features.AdminUniversities;

/// <summary>Wrapper del listado admin de universidades (US-060).</summary>
public sealed record AdminUniversityListResponse(IReadOnlyList<AdminUniversityListItem> Items);
