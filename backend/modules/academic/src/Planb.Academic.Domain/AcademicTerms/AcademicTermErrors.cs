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
}
