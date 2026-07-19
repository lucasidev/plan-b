namespace Planb.Academic.Application.Features.AdminAcademicTerms;

/// <summary>Wrapper del listado admin de períodos lectivos de una universidad (US-064).</summary>
public sealed record AdminAcademicTermListResponse(IReadOnlyList<AdminAcademicTermListItem> Items);
