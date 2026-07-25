namespace Planb.Academic.Application.Features.AdminCommissions;

/// <summary>Revierte el soft delete de una comisión (US-093, admin).</summary>
public sealed record ReactivateCommissionCommand(Guid CommissionId);
