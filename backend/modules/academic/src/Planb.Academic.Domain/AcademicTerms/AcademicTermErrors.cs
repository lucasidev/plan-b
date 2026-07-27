using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.AcademicTerms;

public static class AcademicTermErrors
{
    public static readonly Error YearOutOfRange =
        Error.Validation(
            "academic.term.year_out_of_range",
            "AcademicTerm year must be a positive year not in the far future.");

    public static readonly Error NumberOutOfRange =
        Error.Validation(
            "academic.term.number_out_of_range",
            "AcademicTerm number must be between 1 and 6.");

    public static readonly Error NumberInconsistentWithKind =
        Error.Validation(
            "academic.term.number_inconsistent_with_kind",
            "AcademicTerm with kind=anual must have number=1; other kinds require number >= 1 matching the cadence.");

    public static readonly Error DatesInverted =
        Error.Validation(
            "academic.term.dates_inverted",
            "AcademicTerm end_date must be strictly after start_date.");

    public static readonly Error EnrollmentWindowInverted =
        Error.Validation(
            "academic.term.enrollment_window_inverted",
            "AcademicTerm enrollment_closes must be strictly after enrollment_opens.");

    public static readonly Error LabelRequired =
        Error.Validation(
            "academic.term.label_required",
            "AcademicTerm label is required.");

    public static readonly Error NotFound =
        Error.NotFound(
            "academic.term.not_found",
            "AcademicTerm not found.");

    /// <summary>
    /// El university_id de la ruta no corresponde a ninguna University del catálogo. No hay FK
    /// cross-schema (ADR-0017), así que el application layer valida la existencia antes de crear.
    /// </summary>
    public static readonly Error UniversityNotFound =
        Error.NotFound(
            "academic.term.university_not_found",
            "The university for this academic term does not exist.");

    /// <summary>
    /// El (university_id, year, number, kind) ya lo usa otro AcademicTerm de la misma universidad.
    /// Se chequea en el handler vía el repo antes de crear/actualizar. Intra-schema, así que también
    /// hay UNIQUE en DB (<c>ux_academic_terms_uni_year_number_kind</c>).
    /// </summary>
    public static readonly Error AlreadyExists =
        Error.Conflict(
            "academic.term.already_exists",
            "An academic term with that year, number and kind already exists for this university.");

    /// <summary>Kind es obligatorio en el aggregate (a diferencia de Career.Cadence, opcional).</summary>
    public static readonly Error KindRequired =
        Error.Validation("academic.term.kind_required", "AcademicTerm kind is required.");

    /// <summary>
    /// El período ya tiene comisiones, así que su cadencia queda congelada. 409.
    ///
    /// <para>
    /// Crear una comisión valida que la cadencia de la materia coincida con la del período
    /// (<c>CommissionErrors.TermKindMismatch</c>). El update del período no volvía a mirar esa
    /// igualdad, así que un PATCH que cambiaba <c>kind</c> dejaba a todas las comisiones ya creadas
    /// en el estado que la creación rechaza, en silencio y sin forma de enterarse. Los demás campos
    /// (fechas, ventanas de inscripción, número) se siguen pudiendo corregir.
    /// </para>
    /// </summary>
    public static readonly Error KindLockedByCommissions =
        Error.Conflict(
            "academic.term.kind_locked_by_commissions",
            "Cannot change the term kind: commissions already exist for this term.");
}
