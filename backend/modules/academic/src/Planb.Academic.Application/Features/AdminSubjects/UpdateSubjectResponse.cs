namespace Planb.Academic.Application.Features.AdminSubjects;

/// <summary>Id de la materia editada. El frontend refetchea la lista (ADR-0046).</summary>
public sealed record UpdateSubjectResponse(Guid Id);
