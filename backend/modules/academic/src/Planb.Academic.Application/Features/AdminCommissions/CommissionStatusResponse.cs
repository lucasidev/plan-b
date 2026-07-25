namespace Planb.Academic.Application.Features.AdminCommissions;

/// <summary>Estado activo de la comisión tras un toggle (deactivate / reactivate).</summary>
public sealed record CommissionStatusResponse(Guid Id, bool IsActive);
