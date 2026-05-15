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
}
