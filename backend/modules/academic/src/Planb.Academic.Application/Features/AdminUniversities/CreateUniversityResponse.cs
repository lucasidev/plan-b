namespace Planb.Academic.Application.Features.AdminUniversities;

/// <summary>Id de la universidad recién creada. El frontend refetchea la lista (ADR-0046).</summary>
public sealed record CreateUniversityResponse(Guid Id);
