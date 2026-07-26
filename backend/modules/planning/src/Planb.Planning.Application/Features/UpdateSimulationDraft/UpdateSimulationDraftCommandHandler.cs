using Planb.Academic.Application.Contracts;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Identity.Application.Contracts;
using Planb.Planning.Application.Abstractions.Persistence;
using Planb.Planning.Domain.Availability;
using Planb.Planning.Domain.Drafts;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Planning.Application.Features.UpdateSimulationDraft;

/// <summary>
/// Handler de US-023 (editar borrador). Mismos guards que crear (rate limit compartido, profile
/// activo, materias del plan), más la autorización dura: 404 si el borrador no existe, 403 si existe
/// pero es de otro alumno (nunca 404 en ese caso: el AC pide distinguir los dos escenarios).
/// </summary>
public static class UpdateSimulationDraftCommandHandler
{
    private const int MaxSavesPerHour = 60;
    private static readonly TimeSpan RateWindow = TimeSpan.FromHours(1);

    public static async Task<Result<UpdateSimulationDraftResponse>> Handle(
        UpdateSimulationDraftCommand command,
        IIdentityQueryService identity,
        IAcademicQueryService academic,
        ISimulationDraftRepository drafts,
        IPlanningUnitOfWork unitOfWork,
        IRateLimiter rateLimiter,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var rate = await rateLimiter.TryAcquireAsync(
            $"planning:ratelimit:save:{command.UserId}", RateWindow, MaxSavesPerHour, ct);
        if (!rate.Allowed)
        {
            return Result.Failure<UpdateSimulationDraftResponse>(SimulationDraftErrors.RateLimitExceeded);
        }

        var profile = await identity.GetStudentProfileForUserAsync(command.UserId, ct);
        if (profile is null || !profile.IsActive)
        {
            return Result.Failure<UpdateSimulationDraftResponse>(AvailabilityErrors.StudentProfileRequired);
        }

        var draft = await drafts.FindByIdAsync(new SimulationDraftId(command.DraftId), ct);
        if (draft is null)
        {
            return Result.Failure<UpdateSimulationDraftResponse>(SimulationDraftErrors.NotFound);
        }
        if (draft.OwnerProfileId != profile.Id)
        {
            return Result.Failure<UpdateSimulationDraftResponse>(SimulationDraftErrors.NotOwner);
        }

        foreach (var subjectId in command.Items.Select(i => i.SubjectId).Distinct())
        {
            if (!await academic.IsSubjectInPlanAsync(subjectId, profile.CareerPlanId, ct))
            {
                return Result.Failure<UpdateSimulationDraftResponse>(SimulationDraftErrors.SubjectNotInPlan);
            }
        }

        var updated = draft.Update(
            command.Label,
            command.Items.Select(i => (i.SubjectId, i.CommissionId)),
            clock);
        if (updated.IsFailure)
        {
            return Result.Failure<UpdateSimulationDraftResponse>(updated.Error);
        }

        await unitOfWork.SaveChangesAsync(ct);

        return new UpdateSimulationDraftResponse(draft.Id.Value);
    }
}
