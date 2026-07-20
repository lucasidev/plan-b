namespace Planb.Planning.Domain.Availability;

/// <summary>
/// Arista del grafo de correlativas: <paramref name="SubjectId"/> requiere a
/// <paramref name="RequiredSubjectId"/>.
///
/// <para>
/// Versión plana del <c>Prerequisite</c> de Academic. Planning no referencia el dominio de Academic
/// (ADR-0017), así que el read model trae las aristas como ids sueltos y las arma acá.
/// </para>
/// </summary>
public sealed record PrerequisiteEdge(Guid SubjectId, Guid RequiredSubjectId, PrerequisiteKind Kind);

/// <summary>
/// Los dos tipos de correlativa (ADR-0003). Para decidir si el alumno **puede inscribirse** solo
/// pesa <see cref="ParaCursar"/>: <see cref="ParaRendir"/> condiciona rendir el final, no cursar.
/// </summary>
public enum PrerequisiteKind
{
    ParaCursar = 1,
    ParaRendir = 2,
}
