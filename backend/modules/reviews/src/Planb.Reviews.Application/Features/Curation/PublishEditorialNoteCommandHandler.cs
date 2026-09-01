using Planb.Academic.Application.Contracts;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Domain.Curation;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Application.Features.Curation;

/// <summary>
/// Publica una nota del equipo sobre una carrera (ADR-0084).
///
/// <para>
/// La existencia de la carrera se valida contra el contrato de academic: no hay FK cross-schema
/// (ADR-0017), así que una nota colgada de un id inventado se guardaría sin ruido y no aparecería
/// en ninguna ficha, que es la peor forma de fallar.
/// </para>
/// </summary>
public static class PublishEditorialNoteCommandHandler
{
    public static async Task<Result<PublishEditorialNoteResponse>> Handle(
        PublishEditorialNoteCommand command,
        IEditorialNoteRepository notes,
        IAcademicQueryService academic,
        IReviewsUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        if (await academic.GetCareerByIdAsync(command.CareerId, ct) is null)
        {
            return EditorialNoteErrors.CareerNotFound;
        }

        var result = EditorialNote.Publish(command.CareerId, command.Text, clock);
        if (result.IsFailure)
        {
            return result.Error;
        }

        await notes.AddAsync(result.Value, ct);
        await unitOfWork.SaveChangesAsync(ct);

        return new PublishEditorialNoteResponse(result.Value.Id.Value, result.Value.PublishedAt);
    }
}

/// <summary>Retira una nota de la ficha sin borrarla.</summary>
public static class WithdrawEditorialNoteCommandHandler
{
    public static async Task<Result> Handle(
        WithdrawEditorialNoteCommand command,
        IEditorialNoteRepository notes,
        IReviewsUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var note = await notes.GetByIdAsync(new EditorialNoteId(command.NoteId), ct);
        if (note is null)
        {
            return EditorialNoteErrors.NotFound;
        }

        var withdrawn = note.Withdraw(clock);
        if (withdrawn.IsFailure)
        {
            return withdrawn.Error;
        }

        await unitOfWork.SaveChangesAsync(ct);
        return Result.Success();
    }
}
