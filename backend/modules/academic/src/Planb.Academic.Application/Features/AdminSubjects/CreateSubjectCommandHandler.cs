using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Application.Contracts;
using Planb.Academic.Domain.CareerPlans;
using Planb.Academic.Domain.Subjects;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminSubjects;

/// <summary>
/// Handler del POST /api/academic/career-plans/{planId}/subjects (admin). El code es único por
/// plan (UNIQUE(career_plan_id, code) intra-schema), así que se chequea contra el repo antes de
/// crear el aggregate.
/// </summary>
public static class CreateSubjectCommandHandler
{
    public static async Task<Result<CreateSubjectResponse>> Handle(
        CreateSubjectCommand command,
        ISubjectRepository subjects,
        IAcademicQueryService academic,
        IAcademicUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        // CareerPlan y Subject viven en el mismo schema academic (sin FK declarada): validamos la
        // existencia en el app-layer, igual que CreateCareer (ADR-0017). Sin esto queda un Subject huérfano.
        if (!await academic.CareerPlanExistsAsync(command.CareerPlanId, ct))
        {
            return SubjectErrors.CareerPlanNotFound;
        }

        var careerPlanId = new CareerPlanId(command.CareerPlanId);

        var trimmedCode = command.Code.Trim();
        if (await subjects.ExistsByCodeAsync(careerPlanId, trimmedCode, excludeId: null, ct))
        {
            return SubjectErrors.CodeAlreadyExists;
        }

        var result = Subject.Create(
            careerPlanId,
            command.Code,
            command.Name,
            command.YearInPlan,
            command.TermInYear,
            command.TermKind,
            command.WeeklyHours,
            command.TotalHours,
            command.Description,
            clock,
            isOfficial: true);
        if (result.IsFailure)
        {
            return result.Error;
        }

        await subjects.AddAsync(result.Value, ct);
        await unitOfWork.SaveChangesAsync(ct);

        return new CreateSubjectResponse(result.Value.Id.Value);
    }
}
