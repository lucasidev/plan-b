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

        // El flip va en dos pasos y en este orden por una razón dura: el índice único parcial
        // ux_simulation_drafts_owner_term_active (ADR-0052) prohíbe dos Active del mismo (owner,
        // term), y un índice parcial NO se puede diferir en Postgres, así que se evalúa por
        // statement y no al commitear.
        //
        // Si las dos mutaciones viajan en el mismo SaveChanges, el orden lo decide EF (ordena los
        // UPDATE por clave, que acá es un Guid aleatorio): la mitad de las veces emitía primero el
        // que marca el nuevo como Active, y ahí el índice ve dos y aborta. El síntoma era un promote
        // que fallaba de forma intermitente, con un 409 indistinguible de un conflicto legítimo.
        //
        // Archivar primero y flushear deja la ventana en cero Active, nunca en dos. Los dos
        // SaveChanges siguen dentro de la misma transacción (Wolverine la abre alrededor del
        // handler), así que la atomicidad no cambia: o quedan los dos cambios o ninguno.
        var previousActive = await drafts.FindActiveForTermAsync(draft.OwnerProfileId, draft.TermId, ct);
        if (previousActive is not null)
        {
            previousActive.Archive(clock);
            await unitOfWork.SaveChangesAsync(ct);
        }

        var promoted = draft.Promote(clock);
        if (promoted.IsFailure)
        {
            return Result.Failure<PromoteSimulationDraftResponse>(promoted.Error);
        }

        await unitOfWork.SaveChangesAsync(ct);

        return new PromoteSimulationDraftResponse(draft.Id.Value, draft.Status.ToString());
    }
}
