using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.OfficialFacts;

public static class OfficialFactErrors
{
    public static readonly Error SubjectRequired =
        Error.Validation("academic.official_fact.subject_required", "Official fact subject id is required.");

    public static readonly Error FieldRequired =
        Error.Validation("academic.official_fact.field_required", "Official fact field is required.");

    /// <summary>El código no está en el vocabulario curado (<see cref="OfficialFactField"/>). Un typo no se guarda en silencio.</summary>
    public static readonly Error UnknownField =
        Error.Validation(
            "academic.official_fact.unknown_field",
            "Field is not part of the curated vocabulary.");

    public static readonly Error SourceNameRequired =
        Error.Validation("academic.official_fact.source_name_required", "Source name is required.");

    /// <summary>La fuente es obligatoria siempre, incluso cuando el estado es NotPublished: ahí es dónde se buscó.</summary>
    public static readonly Error SourceUrlRequired =
        Error.Validation("academic.official_fact.source_url_required", "Source url is required.");

    public static readonly Error SourceRetrievedAtRequired =
        Error.Validation(
            "academic.official_fact.source_retrieved_at_required",
            "Source retrieved date is required.");

    /// <summary>Published o Derived sin valor: el estado dice que hay un dato, pero no lo trae.</summary>
    public static readonly Error ValueRequired =
        Error.Validation(
            "academic.official_fact.value_required",
            "Value is required when status is Published or Derived.");

    /// <summary>Un Derived cita la regla con la que se calculó (ADR-0090).</summary>
    public static readonly Error DerivationRuleRequired =
        Error.Validation(
            "academic.official_fact.derivation_rule_required",
            "DerivationRuleId is required when status is Derived.");

    /// <summary>Un NotApplicable dice por qué el campo no existe para ese sujeto, en Note.</summary>
    public static readonly Error ReasonRequired =
        Error.Validation(
            "academic.official_fact.reason_required",
            "Note is required when status is NotApplicable.");

    public static readonly Error RelievedAtRequired =
        Error.Validation("academic.official_fact.relieved_at_required", "RelievedAt is required.");

    public static readonly Error RelievedByRequired =
        Error.Validation("academic.official_fact.relieved_by_required", "RelievedBy is required.");

    public static readonly Error NotFound =
        Error.NotFound("academic.official_fact.not_found", "Official fact not found.");

    /// <summary>
    /// El sujeto (institución, unidad académica u oferta) no existe en el catálogo. No hay FK
    /// cross-aggregate (ADR-0017): el application layer valida la existencia antes de crear.
    /// </summary>
    public static readonly Error SubjectNotFound =
        Error.NotFound("academic.official_fact.subject_not_found", "The subject of this official fact does not exist.");
}
