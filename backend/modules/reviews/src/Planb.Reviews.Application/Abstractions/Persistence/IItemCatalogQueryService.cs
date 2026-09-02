namespace Planb.Reviews.Application.Abstractions.Persistence;

/// <summary>
/// Read del catálogo de frases para quien lo cura (US-198). Es el único lugar donde el catálogo se
/// edita, así que la lista trae lo que hace falta para decidir un cambio sin ir a buscar nada más:
/// cuántas respuestas tiene cada frase, si sigue ofreciéndose, y cuándo se la tocó por última vez.
/// </summary>
public interface IItemCatalogQueryService
{
    /// <summary>
    /// El catálogo entero, activas y retiradas, en el orden en que el cuestionario vigente las
    /// pregunta (las retiradas van al final, por código). Las retiradas vienen porque son la mitad
    /// del corte: sin ellas la pantalla no puede mostrar de qué pregunta viene la de hoy.
    /// </summary>
    Task<IReadOnlyList<CatalogItemView>> GetCatalogAsync(CancellationToken ct = default);
}

/// <summary>
/// Una frase tal como sale de la base. Lleva su conteo de respuestas porque es lo que hace real la
/// consecuencia de cortar la serie: son las respuestas que se quedan bajo el código viejo.
///
/// <para>
/// <see cref="LastChangedBy"/> es la cuenta cruda y no un nombre: quién es esa cuenta vive en
/// Identity y se resuelve por su contrato, no por un JOIN cross-schema (ADR-0017).
/// </para>
/// </summary>
public sealed record CatalogItemView(
    Guid Id,
    string Code,
    string Text,
    string? Help,
    string Layer,
    string Subject,
    string Origin,
    bool IsActive,
    /// <summary>El código de la frase que esta reemplaza, cuando nació de un cambio de significado.</summary>
    string? SupersedesCode,
    /// <summary>El código que la reemplazó, si se la retiró abriendo uno nuevo.</summary>
    string? SupersededByCode,
    int AnswerCount,
    DateTimeOffset UpdatedAt,
    DateTimeOffset? RetiredAt,
    Guid? LastChangedBy,
    IReadOnlyList<CatalogOptionView> Options);

/// <summary>Una opción de la frase, con el valor que las respuestas guardan y su etiqueta.</summary>
public sealed record CatalogOptionView(short Value, short Order, string Label, string Valence);
