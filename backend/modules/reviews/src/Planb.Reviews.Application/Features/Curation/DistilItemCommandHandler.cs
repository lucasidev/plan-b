using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Application.Seeding;
using Planb.Reviews.Domain.Catalog;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Application.Features.Curation;

/// <summary>
/// Destila una pregunta del campo libre y la publica (ADR-0084).
///
/// <para>
/// <b>El alta del ítem y la versión nueva del instrumento son una sola operación.</b> El
/// instrumento es lo que la pantalla de reseñar ofrece y lo que Método publica: un ítem que no
/// entra a una versión no existe para nadie, y dejarlo suelto crearía un estado a medias que
/// alguien tiene que acordarse de terminar.
/// </para>
///
/// <para>
/// <b>El corte de serie sale solo.</b> Los conteos de la ficha se calculan por ítem sobre las
/// respuestas que ese ítem tiene, así que uno que estrena su versión arranca con las suyas y no
/// hereda nada: no hay que cortar nada a mano, hay que no mezclar. Lo que el corte sí necesita es
/// ser visible, y para eso está el origen del ítem, que Método publica.
/// </para>
/// </summary>
public static class DistilItemCommandHandler
{
    public static async Task<Result<DistilItemResponse>> Handle(
        DistilItemCommand command,
        ICatalogRepository catalog,
        IReviewsUnitOfWork unitOfWork,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var code = command.Code.Trim().ToUpperInvariant();
        if (await catalog.ItemCodeExistsAsync(code, excludeId: null, ct))
        {
            return ItemErrors.CodeAlreadyExists;
        }

        var current = await catalog.GetCurrentInstrumentAsync(CatalogSeedData.StudentCourseCode, ct);
        if (current is null)
        {
            // Sin instrumento vigente no hay a qué sumarle una pregunta: la versión nueva se define
            // como "lo que ya se pregunta, más esta".
            return InstrumentErrors.NotFound;
        }

        var itemResult = Item.Create(
            code,
            command.Text,
            command.Help,
            command.Layer,
            command.Subject,
            command.Options.Select(o => (o.Value, o.Order, o.Label, o.Valence)),
            clock,
            ItemOrigin.Distilled);

        if (itemResult.IsFailure)
        {
            return itemResult.Error;
        }

        var item = itemResult.Value;

        // La versión nueva son los ítems de la vigente en su mismo orden, y el destilado al final.
        var items = current.Items
            .OrderBy(i => i.Order)
            .Select(i => (i.ItemId, i.Order))
            .Append((item.Id, (short)(current.Items.Count + 1)))
            .ToList();

        var published = Instrument.Publish(
            current.Code, (short)(current.Version + 1), items, clock);

        if (published.IsFailure)
        {
            return published.Error;
        }

        // Cerrar la anterior va último y solo si todo lo de arriba salió: un Result.Failure no es
        // una excepción y no dispara el rollback de Wolverine, así que cerrarla antes dejaría el
        // instrumento sin versión vigente si algo de acá fallaba.
        var closed = current.Close(clock);
        if (closed.IsFailure)
        {
            return closed.Error;
        }

        await catalog.AddItemAsync(item, ct);
        await catalog.AddInstrumentAsync(published.Value, ct);
        await unitOfWork.SaveChangesAsync(ct);

        return new DistilItemResponse(item.Id.Value, item.Code, published.Value.Version);
    }
}
