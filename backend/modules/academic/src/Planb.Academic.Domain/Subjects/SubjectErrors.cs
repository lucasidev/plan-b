using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.Subjects;

public static class SubjectErrors
{
    public static readonly Error CodeRequired =
        Error.Validation(
            "academic.subject.code_required",
            "Subject code is required.");

    public static readonly Error NameRequired =
        Error.Validation(
            "academic.subject.name_required",
            "Subject name is required.");

    public static readonly Error YearInPlanOutOfRange =
        Error.Validation(
            "academic.subject.year_in_plan_out_of_range",
            "Subject year_in_plan must be between 1 and 10.");

    public static readonly Error TermInYearOutOfRange =
        Error.Validation(
            "academic.subject.term_in_year_out_of_range",
            "Subject term_in_year must be between 1 and 6 when present.");

    public static readonly Error TermInYearInconsistentWithKind =
        Error.Validation(
            "academic.subject.term_in_year_inconsistent_with_kind",
            "Subject with kind=anual must have term_in_year=null; with any other kind, term_in_year is required.");

    public static readonly Error WeeklyHoursOutOfRange =
        Error.Validation(
            "academic.subject.weekly_hours_out_of_range",
            "Subject weekly_hours must be between 1 and 40.");

    public static readonly Error TotalHoursOutOfRange =
        Error.Validation(
            "academic.subject.total_hours_out_of_range",
            "Subject total_hours must be positive and at least equal to weekly_hours.");

    public static readonly Error NotFound =
        Error.NotFound(
            "academic.subject.not_found",
            "Subject not found.");

    public static readonly Error AlreadyInactive =
        Error.Conflict(
            "academic.subject.already_inactive",
            "Subject is already inactive.");

    public static readonly Error AlreadyActive =
        Error.Conflict(
            "academic.subject.already_active",
            "Subject is already active.");

    /// <summary>
    /// Otras materias del plan la declaran como correlativa. Desactivarla dejaría esas correlativas
    /// apuntando a una materia archivada, así que el admin tiene que reasignarlas primero (US-062).
    /// El endpoint devuelve además el listado de dependientes para que sepa cuáles tocar.
    /// </summary>
    public static readonly Error HasDependents =
        Error.Conflict(
            "academic.subject.has_dependents",
            "Other subjects declare this one as a prerequisite. Reassign them before deactivating.");

    public static readonly Error CodeAlreadyExists =
        Error.Conflict(
            "academic.subject.code_already_exists",
            "Another subject in this career plan already uses this code.");

    /// <summary>
    /// El career_plan_id de la ruta no corresponde a ningún CareerPlan del catálogo. No hay FK
    /// cross-schema (ADR-0017), así que el application layer valida la existencia antes de crear.
    /// </summary>
    public static readonly Error CareerPlanNotFound =
        Error.NotFound(
            "academic.subject.career_plan_not_found",
            "The career plan for this subject does not exist.");

    /// <summary>TermKind es obligatorio en el aggregate (mismo criterio que AcademicTerm.Kind).</summary>
    public static readonly Error TermKindRequired =
        Error.Validation(
            "academic.subject.term_kind_required",
            "Subject term_kind is required.");
}
