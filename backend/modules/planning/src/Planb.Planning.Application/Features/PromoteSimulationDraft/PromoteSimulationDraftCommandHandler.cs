using Planb.Identity.Application.Contracts;
using Planb.Planning.Application.Abstractions.Persistence;
using Planb.Planning.Domain.Availability;
using Planb.Planning.Domain.Drafts;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Planning.Application.Features.PromoteSimulationDraft;

/// <summary>
/// Handler de US-023 (promover un borrador a plan vigente). El AC pide que a lo sumo un draft quede
/// Active por (owner, term): si el alumno ya tenía otro Active para el mismo término, ese pasa a
/// Archived en la misma transacción (flip atómico, nunca dos activos). Si el draft llamado ya estaba
/// Active, la respuesta es idempotente (200 con su estado actual), no 409: el AC lo pide explícito
/// para no romper ante un doble-click del alumno.
/// </summary>
public static class PromoteSimulationDraftCommandHandler
{
    public static async Task<Result<PromoteSimulationDraftResponse>> Handle(
        PromoteSimulationDraftCommand command,
        IIdentityQueryService identity,
        ISimulationDraftRepository drafts,
        IPlanningUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var profile = await identity.GetStudentProfileForUserAsync(command.UserId, ct);
        if (profile is null || !profile.IsActive)
        {
            return Result.Failure<PromoteSimulationDraftResponse>(AvailabilityErrors.StudentProfileRequired);
        }

        var draft = await drafts.FindByIdAsync(new SimulationDraftId(command.DraftId), ct);
        if (draft is null)
        {
            return Result.Failure<PromoteSimulationDraftResponse>(SimulationDraftErrors.NotFound);
        }
        if (draft.OwnerProfileId != profile.Id)
        {
            return Result.Failure<PromoteSimulationDraftResponse>(SimulationDraftErrors.NotOwner);
        }

        // Idempotencia explícita (US-023 AC): un segundo promote sobre un draft ya Active no es un
        // conflicto, es un no-op que confirma el estado actual.
        if (draft.Status == SimulationDraftStatus.Active)
        {
            return new PromoteSimulationDraftResponse(draft.Id.Value, draft.Status.ToString());
        }

        var promoted = draft.Promote(clock);
        if (promoted.IsFailure)
        {
            return Result.Failure<PromoteSimulationDraftResponse>(promoted.Error);
        }

        // Flip: el Active anterior del mismo (owner, term), si existe, pasa a Archived en la misma
        // transacción. La query corre contra la DB todavía no comiteada (SaveChanges es lo último),
        // así que sigue viendo el status pre-mutación de "draft" y no puede auto-matchearse.
        var previousActive = await drafts.FindActiveForTermAsync(draft.OwnerProfileId, draft.TermId, ct);
        previousActive?.Archive(clock);

        await unitOfWork.SaveChangesAsync(ct);

        return new PromoteSimulationDraftResponse(draft.Id.Value, draft.Status.ToString());
    }
}
