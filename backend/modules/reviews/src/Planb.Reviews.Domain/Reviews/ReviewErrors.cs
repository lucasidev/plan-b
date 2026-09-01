using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Domain.Reviews;

/// <summary>Errores de negocio del aggregate <see cref="Review"/> (US-146, ADR-0082).</summary>
public static class ReviewErrors
{
    public static readonly Error NotFound =
        Error.NotFound("reviews.review.not_found", "Review not found.");

    /// <summary>
    /// Una voz por cuenta, materia y período (ADR-0082): es lo que impide que una persona pese como
    /// muchas en el mismo dato. Reseñar de nuevo la misma cursada es editar la que ya existe.
    /// </summary>
    public static readonly Error AlreadyReviewed =
        Error.Conflict(
            "reviews.review.already_reviewed",
            "You already reviewed this cursada. Edit that review instead.");

    /// <summary>
    /// Una reseña sin ninguna respuesta no aporta nada a ningún conteo. Saltear cada ítem es
    /// legítimo, pero entonces no hay reseña que guardar: es una sesión abandonada.
    /// </summary>
    public static readonly Error NoAnswers =
        Error.Validation(
            "reviews.review.no_answers",
            "A review needs at least one answered item.");

    public static readonly Error DuplicateAnswer =
        Error.Conflict(
            "reviews.review.duplicate_answer",
            "The same item cannot be answered twice in one review.");

    /// <summary>El ítem respondido no lo ofrece la versión del instrumento con la que se está respondiendo.</summary>
    public static readonly Error ItemNotInInstrument =
        Error.Validation(
            "reviews.review.item_not_in_instrument",
            "That item is not part of the instrument version being answered.");

    /// <summary>El valor elegido no es ninguna de las opciones del ítem.</summary>
    public static readonly Error OptionNotInItem =
        Error.Validation(
            "reviews.review.option_not_in_item",
            "That option does not belong to the answered item.");

    public static readonly Error FreeTextTooLong =
        Error.Validation(
            "reviews.review.free_text_too_long",
            $"The free text must be at most {Review.MaxFreeTextLength} characters.");

    /// <summary>La materia no existe en el catálogo. Sin FK cross-schema, lo valida el application layer.</summary>
    public static readonly Error SubjectNotFound =
        Error.NotFound(
            "reviews.review.subject_not_found",
            "The subject of this cursada does not exist.");

    /// <summary>El período lectivo no existe en el catálogo.</summary>
    public static readonly Error TermNotFound =
        Error.NotFound(
            "reviews.review.term_not_found",
            "The academic term of this cursada does not exist.");

    /// <summary>
    /// La cátedra no existe, o no es de esa materia. Es opcional (se puede no recordarla), pero si
    /// se declara tiene que ser una de las de la materia: si no, el dato aterrizaría en la ficha
    /// equivocada.
    /// </summary>
    public static readonly Error ChairNotInSubject =
        Error.Validation(
            "reviews.review.chair_not_in_subject",
            "That chair does not belong to the reviewed subject.");

    /// <summary>No hay versión vigente del cuestionario: no se puede reseñar contra nada.</summary>
    public static readonly Error NoCurrentInstrument =
        Error.Conflict(
            "reviews.review.no_current_instrument",
            "There is no current instrument version to answer.");

    /// <summary>Editar o borrar una reseña ajena. El autor es el único que puede tocar la suya.</summary>
    public static readonly Error NotTheAuthor =
        Error.Forbidden(
            "reviews.review.not_the_author",
            "Only the author can edit or delete their review.");
}
