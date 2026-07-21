namespace Planb.Planning.Application.Features.EvaluateSimulation;

/// <summary>
/// Resultado de evaluar una combinación de materias (US-016).
///
/// <para>
/// Si <see cref="IsValid"/> es <c>false</c>, la combinación no es viable (alguna materia
/// bloqueada) y <see cref="BlockedSubjects"/> trae el detalle; ninguna métrica se computa en ese
/// caso (viajan en su default: 0 horas, dificultad null, cohorte en 0/null). Mismo criterio que
/// <c>DeactivateSubjectResponse.Deactivated</c> (Academic, US-062): el rechazo con una lista de
/// detalle no entra en el shape fijo (Code, Message, Type) de <c>Error</c>, así que viaja como
/// valor de éxito del Result y el endpoint decide el status HTTP.
/// </para>
///
/// <para>
/// La materia que no pertenece al plan del alumno es un caso distinto y más simple (no requiere
/// detalle estructurado): se corta antes, como un <c>Result.Failure</c> genérico
/// (<c>EvaluationErrors.SubjectNotInPlan</c>).
/// </para>
///
/// <para>
/// Cuando <see cref="IsValid"/> es <c>true</c>, dos campos pueden venir <c>null</c> a propósito,
/// no por error: <see cref="WeightedDifficulty"/> es null si ninguna materia elegida tiene
/// reseñas todavía ("no sabemos" no es lo mismo que "fácil"), y
/// <see cref="CombinationStats"/>.PassRate/DropoutRate son null si la muestra de la cohorte es 0,
/// o si es menor al piso anti-reidentificación de <c>CombinationCohortStats</c> (ver su docstring
/// para el criterio completo, ADR-0047). <c>CombinationStats.SampleSize</c> en cambio siempre
/// viaja con su valor real: es informativo y no identifica a nadie.
/// </para>
/// </summary>
public sealed record EvaluateSimulationResponse(
    bool IsValid,
    IReadOnlyList<BlockedSubjectItem> BlockedSubjects,
    int TotalWeeklyHours,
    int TotalHours,
    double? WeightedDifficulty,
    CombinationCohortStats CombinationStats);
