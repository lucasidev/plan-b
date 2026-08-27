using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Domain.Catalog;

/// <summary>Errores de negocio del aggregate <see cref="Instrument"/> (ADR-0082).</summary>
public static class InstrumentErrors
{
    public static readonly Error CodeRequired =
        Error.Validation("reviews.instrument.code_required", "Instrument code is required.");

    public static readonly Error CodeTooLong =
        Error.Validation(
            "reviews.instrument.code_too_long",
            $"Instrument code must be at most {Instrument.MaxCodeLength} characters.");

    public static readonly Error CodeInvalidFormat =
        Error.Validation(
            "reviews.instrument.code_invalid_format",
            "Instrument code must use uppercase letters, digits and underscores only.");

    public static readonly Error VersionNotPositive =
        Error.Validation(
            "reviews.instrument.version_not_positive",
            "Instrument version must be greater than zero.");

    public static readonly Error NotFound =
        Error.NotFound("reviews.instrument.not_found", "Instrument not found.");

    /// <summary>Un cuestionario sin ítems no pregunta nada.</summary>
    public static readonly Error NoItems =
        Error.Validation("reviews.instrument.no_items", "An instrument needs at least one item.");

    public static readonly Error DuplicateItem =
        Error.Conflict(
            "reviews.instrument.duplicate_item",
            "The same item cannot appear twice in one instrument.");

    public static readonly Error DuplicateOrder =
        Error.Conflict(
            "reviews.instrument.duplicate_order",
            "Two items of the same instrument cannot share an order.");

    public static readonly Error AlreadyClosed =
        Error.Conflict(
            "reviews.instrument.already_closed",
            "This instrument version is already closed.");

    /// <summary>
    /// Ya hay otra versión vigente de ese código. Publicar una nueva exige cerrar la anterior en la
    /// misma operación: dos vigentes a la vez dejarían sin definir qué cuestionario se ofrece.
    /// </summary>
    public static readonly Error AnotherVersionIsCurrent =
        Error.Conflict(
            "reviews.instrument.another_version_is_current",
            "Another version of this instrument is still current. Close it in the same operation.");

    /// <summary>
    /// La versión que se quiere publicar no es mayor que la vigente. Las versiones solo avanzan:
    /// es lo que hace que una reseña atada a la v2 sepa que se respondió después de la v1.
    /// </summary>
    public static readonly Error VersionNotIncreasing =
        Error.Conflict(
            "reviews.instrument.version_not_increasing",
            "A new instrument version must be greater than the current one.");

    /// <summary>Uno de los ítems del instrumento no existe en el catálogo.</summary>
    public static readonly Error ItemNotFound =
        Error.NotFound(
            "reviews.instrument.item_not_found",
            "One of the items in this instrument does not exist.");

    /// <summary>
    /// Uno de los ítems está retirado. Un cuestionario nuevo no puede ofrecer algo que se dejó de
    /// preguntar: si se lo quiere de vuelta, primero se restaura en el catálogo.
    /// </summary>
    public static readonly Error ItemRetired =
        Error.Conflict(
            "reviews.instrument.item_retired",
            "Cannot publish an instrument that offers a retired item.");
}
