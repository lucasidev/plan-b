using Planb.SharedKernel.Primitives;

namespace Planb.Planning.Domain.Availability;

/// <summary>
/// Errores del simulador de cuatrimestre, lado "evaluate" (US-016): validar una combinación de
/// materias antes de computar sus métricas. Archivo separado de <see cref="AvailabilityErrors"/>
/// porque aquel documenta explícitamente que es del lado "available".
/// </summary>
public static class EvaluationErrors
{
    /// <summary>
    /// Alguna materia del subset no pertenece al plan del alumno (no está entre las materias
    /// activas de su <c>CareerPlan</c>). Mismo criterio que
    /// <c>EnrollmentRecordErrors.SubjectNotInPlan</c> (Enrollments): 400 Validation, no 404,
    /// porque el recurso "evaluate" existe, lo que falla es el contenido del subset que mandó
    /// el caller.
    /// </summary>
    public static readonly Error SubjectNotInPlan =
        Error.Validation(
            "planning.simulator.subject_not_in_plan",
            "One or more subjects do not belong to the student's career plan.");

    /// <summary>
    /// Una <c>CommissionChoice</c> (US-096) referencia una materia que no está en el subset de
    /// <c>SubjectIds</c> de la misma request. Mismo criterio 400 que <see cref="SubjectNotInPlan"/>:
    /// el contenido de lo que mandó el caller está mal formado, no falta un recurso.
    /// </summary>
    public static readonly Error CommissionSubjectNotRequested =
        Error.Validation(
            "planning.simulator.commission_subject_not_requested",
            "A commission choice references a subject that is not part of the requested combination.");

    /// <summary>Una <c>CommissionChoice</c> (US-096) referencia una comisión que no existe en el catálogo.</summary>
    public static readonly Error CommissionNotFound =
        Error.Validation(
            "planning.simulator.commission_not_found",
            "One or more chosen commissions do not exist.");

    /// <summary>
    /// La comisión elegida existe pero pertenece a otra materia, no a la que indica la
    /// <c>CommissionChoice</c> (US-096).
    /// </summary>
    public static readonly Error CommissionSubjectMismatch =
        Error.Validation(
            "planning.simulator.commission_subject_mismatch",
            "A chosen commission does not belong to the subject it was selected for.");

    /// <summary>La comisión elegida (US-096) existe pero está dada de baja (soft delete, US-093).</summary>
    public static readonly Error CommissionInactive =
        Error.Validation(
            "planning.simulator.commission_inactive",
            "A chosen commission is not active.");

    /// <summary>
    /// Las comisiones elegidas son de cuatrimestres distintos. Una grilla semanal solo tiene sentido
    /// dentro de un período: mezclarlos produce choques que no existen, o cero choques donde sí los
    /// habría, y ese número es el que le dice al alumno si se puede anotar. 400.
    /// </summary>
    public static readonly Error CommissionsSpanMultipleTerms =
        Error.Validation(
            "planning.simulator.commissions_span_multiple_terms",
            "All chosen commissions must belong to the same academic term.");
}
