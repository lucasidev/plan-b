namespace Planb.Academic.Application.Features.AdminPrerequisites;

/// <summary>
/// Arista del grafo de correlativas: <see cref="SubjectId"/> requiere <see cref="RequiredSubjectId"/>
/// según <see cref="Type"/> (string, "ParaCursar"/"ParaRendir"). Shape plano 1:1 con el aggregate
/// <c>Prerequisite</c>, sin joins ni cómputo (US-062).
/// </summary>
public sealed record PrerequisiteEdgeItem(Guid SubjectId, Guid RequiredSubjectId, string Type);
