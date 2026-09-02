using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Domain.Catalog;

/// <summary>Errores de negocio del aggregate <see cref="Item"/> (US-198, ADR-0082).</summary>
public static class ItemErrors
{
    public static readonly Error CodeRequired =
        Error.Validation("reviews.item.code_required", "Item code is required.");

    public static readonly Error CodeTooLong =
        Error.Validation(
            "reviews.item.code_too_long",
            $"Item code must be at most {Item.MaxCodeLength} characters.");

    /// <summary>
    /// El código es la identidad semántica del ítem y viaja en el CSV público y en el Método, así
    /// que se restringe a mayúsculas, dígitos y guión bajo: nada de espacios, tildes ni ñ.
    /// </summary>
    public static readonly Error CodeInvalidFormat =
        Error.Validation(
            "reviews.item.code_invalid_format",
            "Item code must use uppercase letters, digits and underscores only.");

    public static readonly Error CodeAlreadyExists =
        Error.Conflict("reviews.item.code_already_exists", "Another item already uses this code.");

    public static readonly Error TextRequired =
        Error.Validation("reviews.item.text_required", "Item text is required.");

    public static readonly Error TextTooLong =
        Error.Validation(
            "reviews.item.text_too_long",
            $"Item text must be at most {Item.MaxTextLength} characters.");

    public static readonly Error HelpTooLong =
        Error.Validation(
            "reviews.item.help_too_long",
            $"Item help must be at most {Item.MaxHelpLength} characters.");

    public static readonly Error NotFound =
        Error.NotFound("reviews.item.not_found", "Item not found.");

    public static readonly Error OptionLabelRequired =
        Error.Validation("reviews.item.option_label_required", "Every option needs a label.");

    public static readonly Error OptionLabelTooLong =
        Error.Validation(
            "reviews.item.option_label_too_long",
            $"An option label must be at most {ItemOption.MaxLabelLength} characters.");

    /// <summary>
    /// Un ítem sin al menos dos opciones no pregunta nada: no hay respuesta que distinga a nadie de
    /// nadie, y su conteo publicado sería siempre 100 %.
    /// </summary>
    public static readonly Error NotEnoughOptions =
        Error.Validation(
            "reviews.item.not_enough_options",
            "An item needs at least two options.");

    public static readonly Error DuplicateOptionValue =
        Error.Conflict(
            "reviews.item.duplicate_option_value",
            "Two options of the same item cannot share a value.");

    public static readonly Error DuplicateOptionOrder =
        Error.Conflict(
            "reviews.item.duplicate_option_order",
            "Two options of the same item cannot share an order.");

    /// <summary>
    /// El rojo de la ficha marca UNA opción por ítem (ADR-0083). Dos negativas dejarían la alarma
    /// repartida y la moda dejaría de decir de qué lado cae el dato.
    /// </summary>
    public static readonly Error MultipleNegativeOptions =
        Error.Validation(
            "reviews.item.multiple_negative_options",
            "An item can have at most one negative option.");

    /// <summary>
    /// Los ítems de contexto no se publican dato por dato, así que sus opciones no tienen lado. Que
    /// una traiga valencia significa que alguien esperaba verla publicada, y no se va a publicar.
    /// </summary>
    public static readonly Error ContextOptionsCannotHaveValence =
        Error.Validation(
            "reviews.item.context_options_cannot_have_valence",
            "Options of a context item must have no valence: context is never published item by item.");

    /// <summary>
    /// Una opción que ya se respondió no se borra ni cambia de valor: las reseñas viejas la apuntan.
    /// Retirarla es sacarla de lo que se ofrece, no de lo que se guardó.
    /// </summary>
    public static readonly Error OptionValueAlreadyUsed =
        Error.Conflict(
            "reviews.item.option_value_already_used",
            "That option value already has answers and cannot be reused for a different label.");

    public static readonly Error AlreadyRetired =
        Error.Conflict("reviews.item.already_retired", "Item is already retired.");

    public static readonly Error AlreadyActive =
        Error.Conflict("reviews.item.already_active", "Item is already active.");

    /// <summary>
    /// Un ítem retirado ya no se edita (US-198). Su texto es el enunciado bajo el que se respondió,
    /// y cambiarlo reescribiría la pregunta que la ficha muestra al lado de conteos que contestaron
    /// otra cosa.
    /// </summary>
    public static readonly Error RetiredCannotChange =
        Error.Conflict(
            "reviews.item.retired_cannot_change",
            "A retired item cannot be changed: its wording is what its answers replied to.");

    /// <summary>
    /// El ítem que abre un código nuevo no puede reemplazar a uno ya retirado: la serie que se
    /// corta es la que se está ofreciendo hoy, y encadenar dos cortes sobre el mismo tramo dejaría
    /// dos preguntas vivas reclamando el mismo pasado.
    /// </summary>
    public static readonly Error CannotSupersedeRetired =
        Error.Conflict(
            "reviews.item.cannot_supersede_retired",
            "That item is already retired and cannot be superseded again.");

    /// <summary>
    /// El ítem del desenlace no puede cambiar de código: la tasa de finalización lo busca por su
    /// código, que es una constante del dominio. Retirarlo dejaría a todas las fichas sin esa tasa,
    /// en silencio y sin que nada falle. Su texto y sus opciones sí se editan.
    /// </summary>
    public static readonly Error CannotSupersedeTheOutcomeItem =
        Error.Conflict(
            "reviews.item.cannot_supersede_the_outcome_item",
            "The outcome item is wired into the completion rate by its code and cannot be superseded.");
}
