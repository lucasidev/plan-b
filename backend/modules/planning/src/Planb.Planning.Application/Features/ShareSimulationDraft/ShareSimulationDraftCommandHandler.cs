using Planb.Identity.Application.Contracts;
using Planb.Planning.Application.Abstractions.Persistence;
using Planb.Planning.Domain.Availability;
using Planb.Planning.Domain.Drafts;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Planning.Application.Features.ShareSimulationDraft;

/// <summary>
/// Handler de US-024 (compartir un borrador propio). 404 si no existe, 403 si existe pero es de
/// otro alumno (mismo criterio que Update/Promote/Delete). Idempotente sin chequeo aparte acá: a
/// diferencia de Promote (que además tiene que archivar el Active anterior), <see cref="SimulationDraft.Share"/>
/// ya resuelve el caso "ya estaba Shared" como no-op exitoso, así que el handler solo lo invoca.
/// </summary>
public static class ShareSimulationDraftCommandHandler
{
    public static async Task<Result<ShareSimulationDraftResponse>> Handle(
        ShareSimulationDraftCommand command,
        IIdentityQueryService identity,
        ISimulationDraftRepository drafts,
        IPlanningUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var profile = await identity.GetStudentProfileForUserAsync(command.UserId, ct);
        if (profile is null || !profile.IsActive)
        {
            return Result.Failure<ShareSimulationDraftResponse>(AvailabilityErrors.StudentProfileRequired);
        }

        var draft = await drafts.FindByIdAsync(new SimulationDraftId(command.DraftId), ct);
        if (draft is null)
        {
            return Result.Failure<ShareSimulationDraftResponse>(SimulationDraftErrors.NotFound);
        }
        if (draft.OwnerProfileId != profile.Id)
        {
            return Result.Failure<ShareSimulationDraftResponse>(SimulationDraftErrors.NotOwner);
        }

        var shared = draft.Share(clock);
        if (shared.IsFailure)
        {
            return Result.Failure<ShareSimulationDraftResponse>(shared.Error);
        }

        await unitOfWork.SaveChangesAsync(ct);

        return new ShareSimulationDraftResponse(draft.Id.Value, draft.Visibility.ToString());
    }
}
