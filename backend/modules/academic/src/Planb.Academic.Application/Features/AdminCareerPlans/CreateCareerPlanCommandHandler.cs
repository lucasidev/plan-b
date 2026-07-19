using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Domain.CareerPlans;
using Planb.Academic.Domain.Careers;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminCareerPlans;

/// <summary>
/// Handler del POST /api/academic/careers/{careerId}/plans (admin). El año es único por carrera
/// (constraint UNIQUE(career_id, year)), así que se chequea contra el repo antes de crear el
/// aggregate. Nace Active y oficial (isOfficial: true, lo distingue de los planes crowdsourced de
/// US-088).
/// </summary>
public static class CreateCareerPlanCommandHandler
{
    public static async Task<Result<CreateCareerPlanResponse>> Handle(
        CreateCareerPlanCommand command,
        ICareerPlanRepository plans,
        IAcademicUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var careerId = new CareerId(command.CareerId);

        var existing = await plans.FindByCareerAndYearAsync(careerId, command.Year, ct);
        if (existing is not null)
        {
            return CareerPlanErrors.YearAlreadyTaken;
        }

        var result = CareerPlan.Create(careerId, command.Year, clock, isOfficial: true);
        if (result.IsFailure)
        {
            return result.Error;
        }

        await plans.AddAsync(result.Value, ct);
        await unitOfWork.SaveChangesAsync(ct);

        return new CreateCareerPlanResponse(result.Value.Id.Value);
    }
}
