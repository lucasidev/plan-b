using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.CareerPlans;

public static class CareerPlanErrors
{
    public static readonly Error YearOutOfRange =
        Error.Validation(
            "academic.career_plan.year_out_of_range",
            "Career plan year must be a positive year not in the future.");

    public static readonly Error NotFound =
        Error.NotFound(
            "academic.career_plan.not_found",
            "Career plan not found.");

    /// <summary>Ya existe un plan para ese (career, year). Constraint UNIQUE(career_id, year).</summary>
    public static readonly Error YearAlreadyTaken =
        Error.Conflict(
            "academic.career_plan.year_already_taken",
            "A plan for that year already exists for this career.");

    public static readonly Error AlreadyDeprecated =
        Error.Conflict(
            "academic.career_plan.already_deprecated", "Career plan is already deprecated.");

    public static readonly Error AlreadyActive =
        Error.Conflict(
            "academic.career_plan.already_active", "Career plan is already active.");
}
