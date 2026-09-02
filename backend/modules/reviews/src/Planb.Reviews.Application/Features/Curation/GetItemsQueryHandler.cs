using Planb.Identity.Application.Contracts;
using Planb.Reviews.Application.Abstractions.Persistence;

namespace Planb.Reviews.Application.Features.Curation;

/// <summary>
/// El catálogo de frases como lo lee quien lo cura (US-198, E1): un solo lugar donde está todo lo
/// que hace falta para decidir un cambio.
///
/// <para>
/// Quién hizo el último cambio se resuelve por el contrato de Identity y no por un JOIN: la cuenta
/// vive en otro schema (ADR-0017), y se pide en una sola llamada para todas las filas, no una por
/// frase (ADR-0087).
/// </para>
/// </summary>
public static class GetItemsQueryHandler
{
    public static async Task<GetItemsResponse> Handle(
        GetItemsQuery _,
        IItemCatalogQueryService catalog,
        IIdentityQueryService identity,
        CancellationToken ct)
    {
        var items = await catalog.GetCatalogAsync(ct);

        var authorIds = items
            .Select(i => i.LastChangedBy)
            .OfType<Guid>()
            .Distinct()
            .ToList();

        var authors = await identity.GetEmailsAsync(authorIds, ct);

        return new GetItemsResponse(
            items.Select(i => new CatalogItemResponse(
                    i.Id,
                    i.Code,
                    i.Text,
                    i.Help,
                    i.Layer,
                    i.Subject,
                    i.Origin,
                    i.IsActive,
                    i.SupersedesCode,
                    i.SupersededByCode,
                    i.AnswerCount,
                    i.UpdatedAt,
                    i.RetiredAt,
                    LastChangedBy(i.LastChangedBy, authors),
                    i.Options
                        .Select(o => new CatalogOptionResponse(o.Value, o.Order, o.Label, o.Valence))
                        .ToList()))
                .ToList());
    }

    /// <summary>
    /// Null cuando la frase no la tocó nadie, y también cuando la cuenta que la tocó ya no existe:
    /// en los dos casos no hay a quién atribuirlo, y un id crudo en pantalla no dice nada.
    /// </summary>
    private static string? LastChangedBy(Guid? accountId, IReadOnlyDictionary<Guid, string> authors) =>
        accountId is { } id && authors.TryGetValue(id, out var email) ? email : null;
}
