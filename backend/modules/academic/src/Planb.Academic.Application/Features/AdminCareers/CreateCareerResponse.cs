namespace Planb.Academic.Application.Features.AdminCareers;

/// <summary>Id de la carrera recién creada. El frontend refetchea la lista (ADR-0046).</summary>
public sealed record CreateCareerResponse(Guid Id);
