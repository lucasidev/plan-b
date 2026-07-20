namespace Planb.Planning.Domain.Availability;

/// <summary>
/// Resultado de evaluar una materia del plan contra el historial del alumno.
/// </summary>
/// <param name="SubjectId">La materia evaluada.</param>
/// <param name="Status">Si puede inscribirse, qué se lo impide, o por qué no aplica.</param>
/// <param name="BlockedBy">
/// Correlativas <c>para_cursar</c> que todavía no cumple. Vacío salvo que
/// <paramref name="Status"/> sea <see cref="AvailabilityStatus.Blocked"/>. El AC pide devolver
/// cuáles faltan y no solo un booleano: "no podés" sin el motivo no le sirve al alumno para
/// decidir.
/// </param>
public sealed record SubjectAvailability(
    Guid SubjectId,
    AvailabilityStatus Status,
    IReadOnlyList<Guid> BlockedBy)
{
    public bool IsAvailable => Status == AvailabilityStatus.Available;
}

/// <summary>
/// Por qué una materia se puede o no cursar el próximo período.
///
/// <para>
/// Los tres últimos valores no son "bloqueada": distinguirlos importa porque el motivo es distinto y
/// la acción del alumno también. A una bloqueada le faltan correlativas (y puede ir a cursar esas);
/// una regularizada le pide rendir el final, no volver a cursarla.
/// </para>
/// </summary>
public enum AvailabilityStatus
{
    /// <summary>Cumple todas las correlativas para cursar y todavía no la cursó (o la desaprobó).</summary>
    Available = 0,

    /// <summary>Le faltan correlativas (ver <see cref="SubjectAvailability.BlockedBy"/>).</summary>
    Blocked = 1,

    /// <summary>Ya la aprobó: no se ofrece de nuevo.</summary>
    AlreadyPassed = 2,

    /// <summary>Ya la regularizó y le falta el final: tampoco se cursa de nuevo.</summary>
    AlreadyRegularized = 3,

    /// <summary>La está cursando ahora: no se ofrece para el período que viene.</summary>
    InProgress = 4,
}
