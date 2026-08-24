namespace Planb.Academic.Domain.Availability;

/// <summary>
/// Arista del grafo de correlativas: <paramref name="SubjectId"/> requiere a
/// <paramref name="RequiredSubjectId"/>.
///
/// <para>
/// Versión plana del <c>Prerequisite</c>: el evaluador de disponibilidad decide sobre un grafo de
/// ids sueltos y no necesita hidratar el aggregate; el read model arma las aristas desde la consulta.
/// </para>
/// </summary>
public sealed record PrerequisiteEdge(Guid SubjectId, Guid RequiredSubjectId, PrerequisiteKind Kind);

/// <summary>
/// Los dos tipos de correlativa (ADR-0003). Para decidir si el alumno **puede inscribirse** solo
/// pesa <see cref="ToEnroll"/>: <see cref="ToTakeFinal"/> condiciona rendir el final, no cursar.
/// </summary>
public enum PrerequisiteKind
{
    ToEnroll = 1,
    ToTakeFinal = 2,
}
