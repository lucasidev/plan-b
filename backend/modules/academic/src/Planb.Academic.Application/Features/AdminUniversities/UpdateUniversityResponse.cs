namespace Planb.Academic.Application.Features.AdminUniversities;

/// <summary>Id de la universidad editada. El frontend refetchea la lista (ADR-0046).</summary>
public sealed record UpdateUniversityResponse(Guid Id);
