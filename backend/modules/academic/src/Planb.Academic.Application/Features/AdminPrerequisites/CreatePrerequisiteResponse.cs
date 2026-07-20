namespace Planb.Academic.Application.Features.AdminPrerequisites;

/// <summary>Correlativa recién creada. El frontend refetchea el grafo del plan (ADR-0046).</summary>
public sealed record CreatePrerequisiteResponse(Guid SubjectId, Guid RequiredSubjectId, string Type);
