using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Domain.Catalog;
using Planb.Reviews.Domain.Reviews;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Application.Features.ReviseReview;

/// <summary>
/// Corregir una reseña de cursada propia (US-165, ADR-0082).
///
/// <para>
/// Editar es reemplazar lo respondido, no parchearlo: se puede cambiar una respuesta, agregar una
/// que se había salteado, o **dejar de responder** algo, y en ese caso la respuesta desaparece y su
/// ítem vuelve a no contarla en el denominador. Por eso el comando trae el set completo y no un
/// delta: un delta no puede expresar "esto ya no lo quiero contestar".
/// </para>
///
/// <para>
/// Editar mueve los conteos de la ficha hacia atrás, y está bien: lo que se publica es lo que hoy
/// sostienen sus voces, no lo que alguna vez se dijo. Nada acá toca un conteo, porque la ficha los
/// calcula al leerse.
/// </para>
/// </summary>
public static class ReviseReviewCommandHandler
{
    public static async Task<Result<ReviseReviewResponse>> Handle(
        ReviseReviewCommand command,
        IReviewRepository reviews,
        ICatalogRepository catalog,
        IReviewsUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var review = await reviews.GetByIdAsync(new ReviewId(command.ReviewId), ct);
        if (review is null)
        {
            return ReviewErrors.NotFound;
        }

        // Solo su autor la edita. Se responde igual que "no existe" para no confirmarle a nadie
        // que una reseña ajena existe: quién reseñó qué no se filtra ni por un código de error.
        if (!review.IsAuthoredBy(command.UserId))
        {
            return ReviewErrors.NotFound;
        }

        // Se valida contra el cuestionario con el que se respondió, no contra el vigente: si el
        // catálogo cambió desde entonces, corregir una respuesta vieja no puede exigirle al autor
        // que conteste preguntas que no le hicieron.
        var instrument = await catalog.GetInstrumentByIdAsync(review.InstrumentId, ct);
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

        var answers = new List<(ItemId ItemId, short OptionValue)>(command.Answers.Count);
        foreach (var answer in command.Answers)
        {
            if (!itemsByCode.TryGetValue(answer.ItemCode, out var item))
            {
                return ReviewErrors.ItemNotInInstrument;
            }
            answers.Add((item.Id, answer.OptionValue));
        }

        var revised = review.Revise(answers, command.FreeText, allowedOptionsByItem, clock);
        if (revised.IsFailure)
        {
            return revised.Error;
        }

        await unitOfWork.SaveChangesAsync(ct);

        return new ReviseReviewResponse(review.Id.Value, review.Answers.Count);
    }
}
