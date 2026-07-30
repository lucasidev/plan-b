using Planb.SharedKernel.Primitives;

namespace Planb.Enrollments.Domain.EnrollmentRecords;

public static class EnrollmentRecordErrors
{
    public static readonly Error GradeOutOfRange =
        Error.Validation(
            "enrollments.record.grade_out_of_range",
            "Grade must be between 0 and 10.");

    public static readonly Error GradeRequiredForStatus =
        Error.Validation(
            "enrollments.record.grade_required_for_status",
            "Status 'aprobada' or 'regular' requires a grade.");

    public static readonly Error GradeNotAllowedForStatus =
        Error.Validation(
            "enrollments.record.grade_not_allowed_for_status",
            "Status 'cursando', 'reprobada' or 'abandonada' must not carry a grade.");

    public static readonly Error ApprovalMethodRequiredForAprobada =
        Error.Validation(
            "enrollments.record.approval_method_required",
            "Status 'aprobada' requires an approval_method.");

    public static readonly Error ApprovalMethodNotAllowedForStatus =
        Error.Validation(
            "enrollments.record.approval_method_not_allowed",
            "Status other than 'aprobada' must not carry an approval_method.");

    public static readonly Error EquivalenciaRequiresNoCommissionNorTerm =
        Error.Validation(
            "enrollments.record.equivalencia_no_commission_no_term",
            "Approval method 'equivalencia' requires both commission_id and term_id to be null.");

    public static readonly Error FinalLibreRequiresTermWithoutCommission =
        Error.Validation(
            "enrollments.record.final_libre_term_only",
            "Approval method 'final_libre' requires term_id present and commission_id null.");

    /// <summary>
    /// Aprobar cursando exige saber el período. La comisión NO se exige.
    ///
    /// <para>
    /// Exigirla dejaba fuera el caso mayoritario del sistema: el historial académico (SIU y
    /// equivalentes) lista materia, fecha, nota y condición, y en ningún lado la comisión, así que
    /// el import de US-014 nunca podía propagarla. Con la comisión obligatoria, importar un
    /// historial con una sola materia aprobada por cursada devolvía 400 y no importaba nada: el
    /// import solo podía registrar equivalencias y finales libres, que son la minoría de cualquier
    /// historial real.
    /// </para>
    /// <para>
    /// La comisión sigue siendo el vínculo con el docente, pero desde ADR-0060 su ausencia ya no
    /// bloquea el publish (una cursada sin comisión puede reseñarse igual). Lo que persiste es
    /// <c>DapperPendingReviewsQueryService</c>, que sigue filtrando <c>commission_id IS NOT NULL</c>
    /// al armar el listado de "pendientes de reseñar": una cursada sin comisión no aparece ahí como
    /// sugerencia, aunque publicarla directamente por <c>enrollmentId</c> ya funcione. O sea que el
    /// dato faltante degrada una función (el descubrimiento) y no corrompe ninguna: exactamente lo
    /// que queremos frente a un dato que la plataforma no tiene (ADR-0054).
    /// </para>
    /// </summary>
    public static readonly Error CursadaApprovalRequiresTerm =
        Error.Validation(
            "enrollments.record.cursada_requires_term",
            "Approval methods 'cursada', 'promocion' or 'final' require term_id.");

    public static readonly Error CursandoRequiresTerm =
        Error.Validation(
            "enrollments.record.cursando_requires_term",
            "Status 'cursando' requires term_id (and typically commission_id).");

    public static readonly Error NotFound =
        Error.NotFound(
            "enrollments.record.not_found",
            "EnrollmentRecord not found.");

    public static readonly Error Duplicate =
        Error.Conflict(
            "enrollments.record.duplicate",
            "An enrollment record already exists for this (student, subject, term) combination.");

    public static readonly Error StudentProfileRequired =
        Error.NotFound(
            "enrollments.record.student_profile_required",
            "The user does not have an active student profile.");

    public static readonly Error SubjectNotInPlan =
        Error.Validation(
            "enrollments.record.subject_not_in_plan",
            "The selected subject does not belong to the student's career plan.");

    // Coherencia de las referencias cross-BC (comisión y período). No hay FK que las sostenga
    // (ADR-0017), así que el application layer es el único lugar donde se validan. Son cuatro errores
    // distintos y no uno genérico porque desde el cliente cada caso se arregla distinto.

    public static readonly Error TermNotInUniversity =
        Error.Validation(
            "enrollments.record.term_not_in_university",
            "The selected academic term does not belong to the student's university.");

    public static readonly Error CommissionNotFound =
        Error.Validation(
            "enrollments.record.commission_not_found",
            "The selected commission does not exist.");

    public static readonly Error CommissionNotForSubject =
        Error.Validation(
            "enrollments.record.commission_not_for_subject",
            "The selected commission belongs to a different subject.");

    public static readonly Error CommissionNotForTerm =
        Error.Validation(
            "enrollments.record.commission_not_for_term",
            "The selected commission belongs to a different academic term.");

    // Antes los valores de enum inválidos devolvían GradeOutOfRange, así que el usuario recibía
    // "nota fuera de rango" por un campo que no había tocado.

    public static readonly Error InvalidStatus =
        Error.Validation(
            "enrollments.record.invalid_status",
            "Unknown enrollment status.");

    public static readonly Error InvalidApprovalMethod =
        Error.Validation(
            "enrollments.record.invalid_approval_method",
            "Unknown approval method.");
}
