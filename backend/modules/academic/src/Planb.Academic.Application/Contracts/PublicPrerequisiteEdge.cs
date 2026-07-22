namespace Planb.Academic.Application.Contracts;

/// <summary>
/// Arista pública del grafo de correlativas de un plan: <see cref="SubjectId"/> requiere
/// <see cref="RequiredSubjectId"/> según <see cref="Type"/> (string, "ToEnroll"/"ToTakeFinal",
/// ADR-0003). Caller: el grafo de correlativas de la landing, sin auth.
///
/// <para>
/// A diferencia de <c>Features.AdminPrerequisites.PrerequisiteEdgeItem</c> (shape del backoffice,
/// solo ids), acá viajan code + name de ambas materias: un caller anónimo no tiene sesión ni
/// catálogo cacheado para resolverlos con una segunda llamada.
/// </para>
/// </summary>
public sealed record PublicPrerequisiteEdge(
    Guid SubjectId,
    string SubjectCode,
    string SubjectName,
    Guid RequiredSubjectId,
    string RequiredSubjectCode,
    string RequiredSubjectName,
    string Type);
