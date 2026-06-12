using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Domain.Reviews;

public static class ReviewErrors
{
    // -- Construcción del agregado (US-017) ---------------------------------

    public static readonly Error DifficultyRatingOutOfRange =
        Error.Validation(
            "reviews.review.difficulty_rating_out_of_range",
            "Difficulty rating must be between 1 and 5.");

    public static readonly Error OverallRatingOutOfRange =
        Error.Validation(
            "reviews.review.overall_rating_out_of_range",
            "Overall rating must be between 1 and 5.");

    public static readonly Error HoursPerWeekOutOfRange =
        Error.Validation(
            "reviews.review.hours_per_week_out_of_range",
            "Hours per week must be between 0 and 30.");

    public static readonly Error TagNotAllowed =
        Error.Validation(
            "reviews.review.tag_not_allowed",
            "One or more tags are not in the allowed set.");

    public static readonly Error FinalGradeOutOfRange =
        Error.Validation(
            "reviews.review.final_grade_out_of_range",
            "Final grade must be between 0 and 10.");

    public static readonly Error ReviewTextTooShort =
        Error.Validation(
            "reviews.review.text_too_short",
            "Review text must be at least 50 characters.");

    public static readonly Error ReviewTextTooLong =
        Error.Validation(
            "reviews.review.text_too_long",
            "Review text must be at most 2000 characters.");

    /// <summary>
    /// Invariante data-model: al menos uno de <c>subject_text</c> o <c>teacher_text</c> debe
    /// estar presente. Mapea a 400.
    /// </summary>
    public static readonly Error AtLeastOneTextRequired =
        Error.Validation(
            "reviews.review.at_least_one_text_required",
            "At least one of subject_text or teacher_text must be provided.");

    // -- Validaciones cross-cutting del publish (US-017) --------------------

    /// <summary>
    /// El EnrollmentRecord referenciado no existe o no pertenece al user que publica. 404
    /// (anti-enumeration: no distinguimos entre "no existe" y "no es tuya").
    /// </summary>
    public static readonly Error EnrollmentNotFoundOrNotOwned =
        Error.NotFound(
            "reviews.review.enrollment_not_found_or_not_owned",
            "Enrollment record not found or not owned by the current user.");

    /// <summary>
    /// El EnrollmentRecord está en status <c>cursando</c>. Solo se puede reseñar cursadas
    /// finalizadas (aprobada / desaprobada / abandonada / etc).
    /// </summary>
    public static readonly Error EnrollmentStillOngoing =
        Error.Conflict(
            "reviews.review.enrollment_still_ongoing",
            "Cannot review a course that is still ongoing.");

    /// <summary>
    /// El docente reseñado no estaba en la commission del enrollment. Validación cross-BC vía
    /// <c>IAcademicQueryService.GetCommissionTeachers</c>.
    /// </summary>
    public static readonly Error TeacherNotInEnrollmentCommission =
        Error.Validation(
            "reviews.review.teacher_not_in_commission",
            "The reviewed teacher did not teach in the enrollment's commission.");

    /// <summary>
    /// Idempotency: ya existe una reseña para el mismo enrollment. 409. Anclar por cursada
    /// es la regla del data-model (UNIQUE enrollment_id en <c>reviews.reviews</c>).
    /// </summary>
    public static readonly Error AlreadyExistsForEnrollment =
        Error.Conflict(
            "reviews.review.already_exists_for_enrollment",
            "A review already exists for this enrollment.");

    /// <summary>
    /// El enrollment no tiene <c>commission_id</c> asociado (caso típico: equivalencias,
    /// finales libres). Esos casos no son reseñables porque no hay docente para vincular.
    /// </summary>
    public static readonly Error EnrollmentWithoutCommission =
        Error.Conflict(
            "reviews.review.enrollment_without_commission",
            "Cannot review an enrollment that has no associated commission.");

    // -- Editar (US-018) / borrar (US-055) / reportar (US-019) - placeholders ---

    /// <summary>
    /// El user no es autor de la reseña. 403. Aplica a edit y delete.
    /// </summary>
    public static readonly Error NotTheAuthor =
        Error.Forbidden(
            "reviews.review.not_the_author",
            "Only the author can perform this action.");

    /// <summary>
    /// Reseña no encontrada. 404.
    /// </summary>
    public static readonly Error NotFound =
        Error.NotFound(
            "reviews.review.not_found",
            "Review not found.");

    /// <summary>
    /// Intento de transición a un status desde uno incompatible. Por ejemplo editar una
    /// reseña que está en <c>UnderReview</c> o <c>Removed</c> (US-018). 409.
    /// </summary>
    public static readonly Error InvalidStatusTransition =
        Error.Conflict(
            "reviews.review.invalid_status_transition",
            "Review is not in a state that allows this transition.");

    /// <summary>
    /// US-018 cooldown: máximo 5 edits por review en 24h por author. 429.
    /// </summary>
    public static readonly Error EditCooldownExceeded =
        Error.Conflict(
            "reviews.edit.cooldown_exceeded",
            "Maximum number of edits per 24h reached for this review.");

    /// <summary>
    /// US-018: el body del PATCH no trajo ningún campo modificable. 400.
    /// </summary>
    public static readonly Error NothingToUpdate =
        Error.Validation(
            "reviews.edit.nothing_to_update",
            "Provide at least one field to update.");
}
