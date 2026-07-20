namespace Planb.Academic.Application.Features.AdminSubjects;

/// <summary>Id de la materia recién creada. El frontend refetchea la lista (ADR-0046).</summary>
public sealed record CreateSubjectResponse(Guid Id);
