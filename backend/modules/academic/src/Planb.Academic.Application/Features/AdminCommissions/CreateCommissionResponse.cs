namespace Planb.Academic.Application.Features.AdminCommissions;

/// <summary>Id de la comisión recién creada. El frontend refetchea la lista (ADR-0046).</summary>
public sealed record CreateCommissionResponse(Guid Id);
