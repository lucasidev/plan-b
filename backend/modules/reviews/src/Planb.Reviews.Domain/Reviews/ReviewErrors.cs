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
    /// El docente indicado no existe como persona en el catálogo de Academic. Cross-BC vía
    /// <c>IAcademicQueryService.GetTeacherByIdAsync</c>. Reemplaza a
    /// <c>TeacherNotInEnrollmentCommission</c> (retirado junto con la versión anterior del
    /// producto, ADR-0063): ya no se exige que el docente esté en el plantel actual de la
    /// commission de la cursada (eso afirma el presente y una cursada vieja habla del pasado),
    /// pero la identidad del docente sigue atada al catálogo.
    /// </summary>
    public static readonly Error ReviewedTeacherNotFound =
        Error.Validation(
            "reviews.review.reviewed_teacher_not_found",
            "The reviewed teacher does not exist in the catalog.");

    /// <summary>
    /// Invariante del aggregate (decisión de la versión anterior del producto, retirada con
    /// ADR-0063): el nombre del docente reseñado nunca es vacío, aunque su id no esté resuelto. Es
    /// lo mínimo que el alumno declaró.
    /// </summary>
    public static readonly Error ReviewedTeacherNameRequired =
        Error.Validation(
            "reviews.review.reviewed_teacher_name_required",
            "The reviewed teacher name must not be empty.");

    /// <summary>
    /// Idempotency: ya existe una reseña para el mismo enrollment. 409. Anclar por cursada
    /// es la regla del data-model (UNIQUE enrollment_id en <c>reviews.reviews</c>).
    /// </summary>
    public static readonly Error AlreadyExistsForEnrollment =
        Error.Conflict(
            "reviews.review.already_exists_for_enrollment",
            "A review already exists for this enrollment.");

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
    /// reseña <c>Removed</c>, o <c>UnderReview</c> con <see cref="UnderReviewReason.Reports"/>
    /// como razón (US-018). 409.
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

    // -- Votos de utilidad (helpfulness) ------------------------------------

    /// <summary>
    /// El votante es el autor de la reseña. No se puede votar la propia. 403.
    /// </summary>
    public static readonly Error CannotVoteOwnReview =
        Error.Forbidden(
            "reviews.vote.cannot_vote_own_review",
            "You cannot vote on your own review.");

    /// <summary>
    /// Borrar la propia reseña no aplica cuando un moderador ya la removió. 409.
    ///
    /// <para>
    /// Sin este corte quedaba abierto un camino de evasión completo: el moderador remueve una
    /// difamación, el autor borra su propia reseña (que la mueve a <c>Deleted</c> y libera el índice
    /// único parcial, que filtra por <c>status &lt;&gt; 'Deleted'</c>), y la cursada vuelve a figurar
    /// como pendiente de reseñar. Republica el mismo texto y entra como fila nueva, con id nuevo y
    /// sin los reportes upheld encima. El filtro de contenido no lo ataja porque es blacklist más
    /// PII, no detección de difamación, y el moderador no tiene forma de deshacerlo.
    /// </para>
    /// </summary>
    public static readonly Error CannotDeleteRemovedReview =
        Error.Conflict(
            "reviews.review.cannot_delete_removed",
            "A review removed by moderation cannot be deleted by its author.");

    /// <summary>
    /// Tampoco se borra mientras la moderación la está mirando por reportes. 409.
    ///
    /// <para>
    /// Es el mismo mecanismo que <see cref="CannotDeleteRemovedReview"/>, un escalón antes: borrar
    /// mueve la reseña a <c>Deleted</c>, el índice único de la cursada filtra por
    /// <c>status &lt;&gt; 'Deleted'</c>, y el mismo texto vuelve a entrar como fila nueva sin los
    /// reportes abiertos encima. Cortar solo en <c>Removed</c> dejaba abierta la ventana entera
    /// entre que se alcanza el threshold y que un moderador decide, que es justo cuando el autor
    /// tiene el incentivo de sacarla.
    /// </para>
    /// <para>
    /// No aplica a la cuarentena del filtro automático ni a la invalidación por cambio de cursada:
    /// en la primera no hay reportes de los que escaparse (republicar el mismo texto lo vuelve a
    /// frenar); en la segunda, ADR-0063 ya prevé borrar como una salida válida para el alumno. El
    /// autor puede borrar la suya en ambos casos.
    /// </para>
    /// </summary>
    public static readonly Error CannotDeleteReportedReview =
        Error.Conflict(
            "reviews.review.cannot_delete_reported",
            "A review under moderation review cannot be deleted by its author.");

    /// <summary>
    /// Solo se vota una reseña <c>Published</c>. UnderReview / Removed / Deleted no son
    /// votables. 409.
    /// </summary>
    public static readonly Error ReviewNotVotable =
        Error.Conflict(
            "reviews.vote.review_not_votable",
            "Only published reviews can be voted on.");

    // -- Responder reseña (US-040) ------------------------------------------

    /// <summary>El texto de la respuesta es obligatorio (a diferencia de los texts de la reseña). 400.</summary>
    public static readonly Error ResponseTextRequired =
        Error.Validation(
            "reviews.response.text_required", "The response text is required.");

    /// <summary>
    /// Solo se responde una reseña <c>Published</c> (no UnderReview / Removed / Deleted). 409.
    /// </summary>
    public static readonly Error CannotRespondToNonPublished =
        Error.Conflict(
            "reviews.response.review_not_published",
            "Only published reviews can be responded to.");

    /// <summary>
    /// Quien responde no es un docente verificado del docente reseñado por esta reseña (US-040).
    /// Cross-BC vía <c>IIdentityQueryService.HasVerifiedTeacherProfile</c>. 403.
    /// </summary>
    public static readonly Error NotVerifiedTeacherForReview =
        Error.Forbidden(
            "reviews.response.not_verified_teacher",
            "Only the verified teacher reviewed here can respond to this review.");

    /// <summary>
    /// Ya existe una respuesta para esta reseña (una sola por review). El handler lo trata como
    /// idempotencia (devuelve la existente con 200); este error es defensa del aggregate. 409.
    /// </summary>
    public static readonly Error ResponseAlreadyExists =
        Error.Conflict(
            "reviews.response.already_exists",
            "This review already has a teacher response.");

    /// <summary>La reseña no tiene respuesta que editar (US-041). 404.</summary>
    public static readonly Error ResponseNotFound =
        Error.NotFound(
            "reviews.response.not_found", "This review has no teacher response to edit.");

    /// <summary>
    /// US-041 cooldown: máximo 3 edits de la respuesta en 24h. El endpoint mapea este código a 429.
    /// </summary>
    public static readonly Error ResponseEditCooldownExceeded =
        Error.Conflict(
            "reviews.response.edit_cooldown_exceeded",
            "Maximum number of response edits per 24h reached.");
}
