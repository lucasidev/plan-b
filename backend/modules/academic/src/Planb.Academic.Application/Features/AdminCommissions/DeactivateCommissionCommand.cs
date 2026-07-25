namespace Planb.Academic.Application.Features.AdminCommissions;

/// <summary>Soft delete de una comisión (US-093, admin).</summary>
public sealed record DeactivateCommissionCommand(Guid CommissionId);
