using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Domain.CareerPlans;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminCareerPlans;

/// <summary>
/// Handler del POST /api/academic/career-plans/{id}/reactivate (admin). 404 si no existe; 409 si ya
/// estaba activo (idempotencia explícita del aggregate).
/// </summary>
public static class ReactivateCareerPlanCommandHandler
{
    public static async Task<Result<CareerPlanStatusResponse>> Handle(
        ReactivateCareerPlanCommand command,
        ICareerPlanRepository plans,
        IAcademicUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var plan = await plans.FindByIdAsync(new CareerPlanId(command.CareerPlanId), ct);
        if (plan is null)
        {
            return CareerPlanErrors.NotFound;
        }

        var result = plan.Reactivate(clock);
        if (result.IsFailure)
        {
            return result.Error;
        }

        await unitOfWork.SaveChangesAsync(ct);

        return new CareerPlanStatusResponse(plan.Id.Value, plan.Status.ToString());
    }
}
