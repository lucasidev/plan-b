namespace Planb.Reviews.Application.Features.Curation;

/// <summary>El catálogo entero: los que se ofrecen hoy y los que se retiraron con su corte.</summary>
public sealed record GetItemsResponse(IReadOnlyList<CatalogItemResponse> Items);

/// <summary>
/// Una frase del catálogo. <c>AnswerCount</c> es lo que hace concreta la consecuencia de cortar la
/// serie: son las respuestas que se quedan bajo el código viejo y no se comparan con las nuevas.
/// </summary>
public sealed record CatalogItemResponse(
    Guid Id,
    string Code,
    string Text,
    string? Help,
    string Layer,
    string Subject,
    string Origin,
    bool IsActive,
    string? SupersedesCode,
    string? SupersededByCode,
    int AnswerCount,
    DateTimeOffset UpdatedAt,
    DateTimeOffset? RetiredAt,
    string? LastChangedBy,
    IReadOnlyList<CatalogOptionResponse> Options);

/// <summary>Una opción, con el valor que las respuestas guardan y su etiqueta.</summary>
public sealed record CatalogOptionResponse(short Value, short Order, string Label, string Valence);
