using Planb.Identity.Application.Contracts;
using Planb.Planning.Application.Abstractions.Persistence;
using Planb.Planning.Domain.Availability;
using Planb.Planning.Domain.Drafts;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Planning.Application.Features.UnshareSimulationDraft;

/// <summary>
/// Handler de US-024 (dejar de compartir un borrador propio). 404 si no existe, 403 si es de otro
/// alumno. Idempotente: <see cref="SimulationDraft.Unshare"/> ya resuelve el caso "ya era Private"
/// como no-op exitoso.
/// </summary>
public static class UnshareSimulationDraftCommandHandler
{
    public static async Task<Result<UnshareSimulationDraftResponse>> Handle(
        UnshareSimulationDraftCommand command,
        IIdentityQueryService identity,
        ISimulationDraftRepository drafts,
        IPlanningUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var profile = await identity.GetStudentProfileForUserAsync(command.UserId, ct);
        if (profile is null || !profile.IsActive)
        {
            return Result.Failure<UnshareSimulationDraftResponse>(AvailabilityErrors.StudentProfileRequired);
        }

        var draft = await drafts.FindByIdAsync(new SimulationDraftId(command.DraftId), ct);
        if (draft is null)
        {
            return Result.Failure<UnshareSimulationDraftResponse>(SimulationDraftErrors.NotFound);
        }
        if (draft.OwnerProfileId != profile.Id)
        {
            return Result.Failure<UnshareSimulationDraftResponse>(SimulationDraftErrors.NotOwner);
        }

        var unshared = draft.Unshare(clock);
        if (unshared.IsFailure)
        {
            return Result.Failure<UnshareSimulationDraftResponse>(unshared.Error);
        }

        await unitOfWork.SaveChangesAsync(ct);

        return new UnshareSimulationDraftResponse(draft.Id.Value, draft.Visibility.ToString());
    }
}
