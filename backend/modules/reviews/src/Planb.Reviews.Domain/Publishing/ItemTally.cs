using Planb.Reviews.Domain.Catalog;

namespace Planb.Reviews.Domain.Publishing;

/// <summary>
/// Los conteos crudos de una frase para un sujeto: cuántas personas eligieron cada opción. Es lo que
/// la base devuelve y la entrada de todo lo que la ficha calcula.
///
/// <para>
/// El denominador (<see cref="Total"/>) son las respuestas a ESA frase, no las reseñas del sujeto:
/// lo salteado no cuenta (ADR-0082), así que dos frases de la misma cátedra pueden tener
/// denominadores distintos y eso es correcto.
/// </para>
/// </summary>
public sealed record ItemTally(
    string ItemCode,
    ItemLayer Layer,
    IReadOnlyList<OptionTally> Options,
    /// <summary>
    /// Si la frase ya no se ofrece. Una retirada no es una frase menos de la ficha: es el tramo de
    /// antes de la que la reemplazó, y se publica al lado de la nueva declarando que no se comparan.
    /// </summary>
    bool IsRetired = false,
    /// <summary>El código de la frase a la que esta reemplazó, cuando cambió lo que se preguntaba.</summary>
    string? SupersedesCode = null,
    /// <summary>Cuándo dejó de preguntarse. Es la fecha del corte que la ficha enuncia.</summary>
    DateTimeOffset? RetiredAt = null)
{
    /// <summary>Cuántas personas respondieron esta frase.</summary>
    public int Total => Options.Sum(o => o.Count);

    /// <summary>
    /// La opción más elegida: lo que la ficha publica como badge, con su etiqueta literal
    /// (ADR-0083). Ante empate gana la de menor orden, que es una regla arbitraria pero estable:
    /// lo importante es que dos lecturas de los mismos datos den lo mismo.
    /// </summary>
    public OptionTally? Mode =>
        Options.Count == 0
            ? null
            : Options.OrderByDescending(o => o.Count).ThenBy(o => o.Order).First();

    /// <summary>Cuántos eligieron la opción negativa de la frase, si tiene una.</summary>
    public int NegativeCount =>
        Options.Where(o => o.Valence == OptionValence.Negative).Sum(o => o.Count);

    /// <summary>
    /// El intervalo de la proporción negativa. Es lo que se compara contra las cátedras hermanas
    /// para decidir si el contraste se publica.
    /// </summary>
    public WilsonInterval? NegativeInterval => WilsonInterval.For(NegativeCount, Total);
}

/// <summary>Los conteos de una opción: su etiqueta, su lado y cuántos la eligieron.</summary>
public sealed record OptionTally(
    short Value,
    short Order,
    string Label,
    OptionValence Valence,
    int Count);
