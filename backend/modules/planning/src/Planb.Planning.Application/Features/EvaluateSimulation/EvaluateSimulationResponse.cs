namespace Planb.Planning.Application.Features.EvaluateSimulation;

/// <summary>
/// Resultado de evaluar una combinación de materias (US-016).
///
/// <para>
/// Si <see cref="IsValid"/> es <c>false</c>, la combinación no es viable (alguna materia
/// bloqueada) y <see cref="BlockedSubjects"/> trae el detalle. Las horas se computan igual (son una
/// suma del catálogo, no una consulta: se saben aunque la combinación no sirva); lo que no se
/// consultó viaja null, no en su default: <see cref="WeightedDifficulty"/>,
/// <see cref="CombinationStats"/> y <see cref="Clashes"/>, con <see cref="Schedule"/> vacío.
/// Mismo criterio que
/// <c>DeactivateSubjectResponse.Deactivated</c> (Academic, US-062): el rechazo con una lista de
/// detalle no entra en el shape fijo (Code, Message, Type) de <c>Error</c>, así que viaja como
/// valor de éxito del Result y el endpoint decide el status HTTP.
/// </para>
///
/// <para>
/// La materia que no pertenece al plan del alumno es un caso distinto y más simple (no requiere
/// detalle estructurado): se corta antes, como un <c>Result.Failure</c> genérico
/// (<c>EvaluationErrors.SubjectNotInPlan</c>). Lo mismo una <c>CommissionChoice</c> (US-096) mal
/// formada (materia fuera de <see cref="EvaluateSimulationCommand.SubjectIds"/>, comisión
/// inexistente, de otra materia, o inactiva): corta con su propio <c>Result.Failure</c> antes de
/// llegar acá (ver <c>EvaluationErrors</c>).
/// </para>
///
/// <para>
/// Cuando <see cref="IsValid"/> es <c>true</c>, tres campos pueden venir <c>null</c> a propósito,
/// no por error: <see cref="WeightedDifficulty"/> es null si ninguna materia elegida tiene
/// reseñas todavía ("no sabemos" no es lo mismo que "fácil"), <see cref="CombinationStats"/>.PassRate
/// / DropoutRate son null si la muestra de la cohorte es 0, o si es menor al piso
/// anti-reidentificación de <c>CombinationCohortStats</c> (ver su docstring para el criterio
/// completo, ADR-0047), y <see cref="Clashes"/> (US-096) es null cuando NINGUNA materia de la
/// combinación tiene comisión elegida: "no sabemos" también acá, no "cero choques". Con al menos
/// una comisión elegida, <see cref="Clashes"/> es el número real de choques detectados (puede ser
/// 0).
/// </para>
///
/// <para>
/// La distinción que hace <see cref="CombinationStats"/> nullable: el objeto entero es null cuando
/// la consulta de cohorte no corrió (combinación bloqueada), mientras que
/// <c>SampleSize == 0</c> es una medición real (la consulta corrió y no encontró a nadie con esa
/// combinación exacta). Las dos cosas se veían igual cuando el camino bloqueado devolvía
/// <c>new CombinationCohortStats(0, null, null)</c>, y eso convertía un placeholder en una
/// afirmación. Cuando el objeto está presente, su <c>SampleSize</c> siempre es el valor real: es
/// informativo y no identifica a nadie.
/// </para>
/// </summary>
public sealed record EvaluateSimulationResponse(
    bool IsValid,
    IReadOnlyList<BlockedSubjectItem> BlockedSubjects,
    int TotalWeeklyHours,
    int TotalHours,
    double? WeightedDifficulty,
    CombinationCohortStats? CombinationStats,
    IReadOnlyList<SimulationScheduleBlock> Schedule,
    int? Clashes);
