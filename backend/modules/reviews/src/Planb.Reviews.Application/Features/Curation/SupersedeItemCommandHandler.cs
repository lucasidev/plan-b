using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Application.Seeding;
using Planb.Reviews.Domain.Catalog;
using Planb.Reviews.Domain.Reviews;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Application.Features.Curation;

/// <summary>
/// Corta la serie de una frase y abre la de la que la reemplaza (US-198, E2).
///
/// <para>
/// Son cuatro cosas y son una sola operación: nace la frase nueva apuntando a la que reemplaza, entra
/// al instrumento en el MISMO lugar que ocupaba el viejo, el viejo deja de ofrecerse, y la versión
/// anterior del cuestionario se cierra. Dejar cualquiera de las cuatro afuera produce un estado
/// que miente: una frase nueva que nadie ofrece, o dos preguntas distintas ofreciéndose a la vez
/// como si fueran la misma.
/// </para>
///
/// <para>
/// <b>Lo respondido bajo el código viejo no se toca.</b> Ni se migra ni se borra: sigue siendo la
/// respuesta a la pregunta que se hizo. Que la ficha lo muestre como un tramo aparte, y no mezclado
/// con el nuevo, es lo que hace que el corte se vea (E3).
/// </para>
/// </summary>
public static class SupersedeItemCommandHandler
{
    public static async Task<Result<SupersedeItemResponse>> Handle(
        SupersedeItemCommand command,
        ICatalogRepository catalog,
        IReviewsUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var previous = await catalog.GetItemByIdAsync(new ItemId(command.ItemId), ct);
        if (previous is null)
        {
            return ItemErrors.NotFound;
        }

        if (!previous.IsActive)
        {
            return ItemErrors.CannotSupersedeRetired;
        }

        // La tasa de finalización busca su frase por código (PublishingRules.OutcomeItemCode), así
        // que abrirle uno nuevo lo dejaría sin nadie que lo encuentre y todas las fichas perderían
        // esa tasa sin que nada falle. Es la única frase del catálogo con esa atadura.
        if (string.Equals(previous.Code, PublishingRules.OutcomeItemCode, StringComparison.Ordinal))
        {
            return ItemErrors.CannotSupersedeTheOutcomeItem;
        }

        var code = command.Code.Trim().ToUpperInvariant();
        if (string.Equals(code, previous.Code, StringComparison.Ordinal))
        {
            // Mismo código es exactamente lo que este camino no hace: si la pregunta sigue siendo
            // la misma, el camino es editar, que conserva la serie.
            return ItemErrors.CodeAlreadyExists;
        }

        if (await catalog.ItemCodeExistsAsync(code, excludeId: null, ct))
        {
            return ItemErrors.CodeAlreadyExists;
        }

        var current = await catalog.GetCurrentInstrumentAsync(CatalogSeedData.StudentCourseCode, ct);
        if (current is null)
        {
            return InstrumentErrors.NotFound;
        }

        var created = Item.Create(
            code,
            command.Text,
            command.Help,
            command.Layer,
            previous.Subject,
            command.Options.Select(o => (o.Value, o.Order, o.Label, o.Valence)),
            clock,
            previous.Origin,
            command.ChangedBy,
            previous.Id);

        if (created.IsFailure)
        {
            return created.Error;
        }

        var item = created.Value;

        // El sucesor ocupa el lugar del viejo, no el final de la lista: el orden del cuestionario es
        // el orden en que se pregunta, y mandarlo al fondo cambiaría el recorrido de quien reseña
        // por una razón que no tiene nada que ver con él. Si el viejo no estaba en la versión
        // vigente (se retiró del cuestionario antes que del catálogo), el nuevo entra al final.
        var items = current.Items
            .OrderBy(i => i.Order)
            .Select(i => i.ItemId == previous.Id ? (item.Id, i.Order) : (i.ItemId, i.Order))
            .ToList();

        if (items.TrueForAll(i => i.Item1 != item.Id))
        {
            items.Add((item.Id, (short)(current.Items.Count + 1)));
        }

        var published = Instrument.Publish(
            current.Code, (short)(current.Version + 1), items, clock);

        if (published.IsFailure)
        {
            return published.Error;
        }

        // Las mutaciones van al final y solo si todo lo de arriba salió: un Result fallido no es una
        // excepción y no dispara el rollback de Wolverine, así que retirar o cerrar antes dejaría el
        // catálogo sin la pregunta y sin su reemplazo.
        var retired = previous.Retire(clock, command.ChangedBy);
        if (retired.IsFailure)
        {
            return retired.Error;
        }

        var closed = current.Close(clock);
        if (closed.IsFailure)
        {
            return closed.Error;
        }

        await catalog.AddItemAsync(item, ct);
        await catalog.AddInstrumentAsync(published.Value, ct);
        await unitOfWork.SaveChangesAsync(ct);

        return new SupersedeItemResponse(
            item.Id.Value, item.Code, previous.Code, published.Value.Version);
    }
}
