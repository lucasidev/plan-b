using Planb.Identity.Application.Contracts;
using Planb.Planning.Application.Abstractions.Persistence;
using Planb.Planning.Domain.Availability;
using Planb.Planning.Domain.Drafts;
using Planb.SharedKernel.Primitives;

namespace Planb.Planning.Application.Features.DeleteSimulationDraft;

/// <summary>
/// Handler de US-023 (borrar borrador). Hard delete: los borradores son efímeros (data-model), no
/// hay soft delete acá. 404 si no existe, 403 si existe pero es de otro alumno.
/// </summary>
public static class DeleteSimulationDraftCommandHandler
{
    public static async Task<Result> Handle(
        DeleteSimulationDraftCommand command,
        IIdentityQueryService identity,
        ISimulationDraftRepository drafts,
        IPlanningUnitOfWork unitOfWork,
        CancellationToken ct)
    {
        var profile = await identity.GetStudentProfileForUserAsync(command.UserId, ct);
        if (profile is null || !profile.IsActive)
        {
            return AvailabilityErrors.StudentProfileRequired;
        }

        var draft = await drafts.FindByIdAsync(new SimulationDraftId(command.DraftId), ct);
        if (draft is null)
        {
            return SimulationDraftErrors.NotFound;
        }
        if (draft.OwnerProfileId != profile.Id)
        {
            return SimulationDraftErrors.NotOwner;
        }

        drafts.Remove(draft);
        await unitOfWork.SaveChangesAsync(ct);

        return Result.Success();
    }
}
