namespace Planb.Academic.Application.Features.AdminCommissions;

/// <summary>Wrapper del listado admin de comisiones de una materia+término (US-093).</summary>
public sealed record AdminCommissionListResponse(IReadOnlyList<AdminCommissionListItem> Items);
