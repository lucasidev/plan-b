using Planb.Academic.Application.Contracts;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Domain.Catalog;
using Planb.Reviews.Domain.Reviews;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Application.Features.PublishReview;

/// <summary>
/// Handler de US-146: publicar la reseña de una cursada. El flujo:
/// <list type="number">
///   <item>La materia tiene que existir en el catálogo. Sin FK cross-schema (ADR-0017), la
///         existencia se valida acá.</item>
///   <item>El período también, por lo mismo: una reseña colgada de un período inventado no se
///         puede ubicar en ninguna serie.</item>
///   <item>La cátedra es opcional (no siempre se la recuerda), pero si se declara tiene que ser
///         una de las de esa materia: si no, el dato aterrizaría en la ficha equivocada.</item>
///   <item>Se resuelve el instrumento vigente y sus frases. De ahí sale el juego de pares
///         (frase, opción) que el aggregate exige: es lo que hace imposible guardar una respuesta
///         a algo que no se preguntó, o una opción inventada.</item>
///   <item>Una voz por cuenta, materia y período (ADR-0082): si ya reseñó esa cursada, se le dice
///         que edite la que tiene en vez de crear una segunda.</item>
///   <item><see cref="Review.Create"/> valida el resto y arma el aggregate. El SaveChanges lo
///         dispara el middleware [Transactional] de Wolverine.</item>
/// </list>
///
/// <para>
/// Lo que este handler NO hace, a propósito: no filtra ni modera el campo libre, porque no se
/// publica nunca (ADR-0084); y no toca ningún conteo, porque los de la ficha se calculan al leerla.
/// </para>
/// </summary>
public static class PublishReviewCommandHandler
{
    public static async Task<Result<PublishReviewResponse>> Handle(
        PublishReviewCommand command,
        IReviewRepository reviews,
        ICatalogRepository catalog,
        IReviewsUnitOfWork unitOfWork,
        IAcademicQueryService academic,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        // 1) La materia existe.
        var subject = await academic.GetSubjectByIdAsync(command.SubjectId, ct);
        if (subject is null)
        {
            return ReviewErrors.SubjectNotFound;
        }

        // 2) El período existe.
        if (!await academic.AcademicTermExistsAsync(command.TermId, ct))
        {
            return ReviewErrors.TermNotFound;
        }

        // 3) La cátedra, si se declaró, es de esta materia.
        if (command.ChairId is { } chairId)
        {
            var chairs = await academic.ListChairsBySubjectAsync(command.SubjectId, ct);
            if (chairs.All(c => c.Id != chairId))
            {
                return ReviewErrors.ChairNotInSubject;
            }
        }

        // 4) El cuestionario vigente y lo que admite cada una de sus frases.
        var instrument = await catalog.GetCurrentInstrumentAsync(
            PublishingRules.CourseInstrumentCode, ct);
        if (instrument is null)
        {
            return ReviewErrors.NoCurrentInstrument;
        }

        var offeredItems = await catalog.GetItemsByIdsAsync(
            instrument.Items.Select(i => i.ItemId).ToList(), ct);

        var itemsByCode = offeredItems.ToDictionary(i => i.Code, StringComparer.Ordinal);
        var allowedOptionsByItem = offeredItems.ToDictionary(
            item => item.Id,
            item => (IReadOnlySet<short>)item.Options.Select(o => o.Value).ToHashSet());

        // Los códigos llegan del front; traducirlos acá deja que el aggregate hable solo de ids.
        var answers = new List<(ItemId ItemId, short OptionValue)>(command.Answers.Count);
        foreach (var answer in command.Answers)
        {
            if (!itemsByCode.TryGetValue(answer.ItemCode, out var item))
            {
                return ReviewErrors.ItemNotInInstrument;
            }
            answers.Add((item.Id, answer.OptionValue));
        }

        // 5) Una voz por cuenta, materia y período.
        var existing = await reviews.GetByCursadaAsync(
            command.UserId, command.SubjectId, command.TermId, ct);
        if (existing is not null)
        {
            return ReviewErrors.AlreadyReviewed;
        }

        // 6) El aggregate valida el resto y se arma.
        var created = Review.Create(
            command.UserId,
            command.SubjectId,
            command.TermId,
            command.ChairId,
            instrument.Id,
            answers,
            command.FreeText,
            allowedOptionsByItem,
            clock);

        if (created.IsFailure)
        {
            return created.Error;
        }

        var review = created.Value;
        await reviews.AddAsync(review, ct);
        await unitOfWork.SaveChangesAsync(ct);

        return new PublishReviewResponse(review.Id.Value, review.Answers.Count);
    }
}
