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
}
