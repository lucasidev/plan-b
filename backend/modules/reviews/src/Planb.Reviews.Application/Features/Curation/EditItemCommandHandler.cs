using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Domain.Catalog;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Application.Features.Curation;

/// <summary>
/// Aplica una edición que no corta la serie (US-198, E1).
///
/// <para>
/// El instrumento no se toca: la versión vigente sigue ofreciendo la misma frase, con el mismo
/// código y en el mismo orden. Lo que cambia es cómo se lee la pregunta, no cuál es, así que las
/// respuestas de antes y las de después se cuentan juntas. Publicar una versión nueva acá sería
/// declarar un corte que no pasó.
/// </para>
/// </summary>
public static class EditItemCommandHandler
{
    public static async Task<Result> Handle(
        EditItemCommand command,
        ICatalogRepository catalog,
        IReviewsUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var item = await catalog.GetItemByIdAsync(new ItemId(command.ItemId), ct);
        if (item is null)
        {
            return ItemErrors.NotFound;
        }

        // Los valores que ya se respondieron no pueden desaparecer del juego nuevo: las reseñas
        // viejas los apuntan. El aggregate rechaza el cambio si alguno falta.
        var answered = await catalog.GetAnsweredOptionValuesAsync(item.Id, ct);

        var result = item.Edit(
            command.Text,
            command.Help,
            command.Layer,
            command.Options.Select(o => (o.Value, o.Order, o.Label, o.Valence)),
            answered,
            clock,
            command.ChangedBy);

        if (result.IsFailure)
        {
            return result.Error;
        }

        await unitOfWork.SaveChangesAsync(ct);
        return Result.Success();
    }
}
