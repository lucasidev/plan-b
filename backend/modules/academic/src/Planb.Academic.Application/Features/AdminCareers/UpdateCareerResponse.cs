namespace Planb.Academic.Application.Features.AdminCareers;

/// <summary>Id de la carrera editada. El frontend refetchea la lista (ADR-0046).</summary>
public sealed record UpdateCareerResponse(Guid Id);
