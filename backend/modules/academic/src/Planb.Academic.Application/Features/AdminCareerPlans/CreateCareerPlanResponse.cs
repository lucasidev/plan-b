namespace Planb.Academic.Application.Features.AdminCareerPlans;

/// <summary>Id del plan recién creado. El frontend refetchea el listado (ADR-0046).</summary>
public sealed record CreateCareerPlanResponse(Guid Id);
