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
}
