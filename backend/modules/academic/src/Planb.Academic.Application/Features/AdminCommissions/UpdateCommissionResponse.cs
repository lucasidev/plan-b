namespace Planb.Academic.Application.Features.AdminCommissions;

/// <summary>Id de la comisión editada. El frontend refetchea la lista (ADR-0046).</summary>
public sealed record UpdateCommissionResponse(Guid Id);
