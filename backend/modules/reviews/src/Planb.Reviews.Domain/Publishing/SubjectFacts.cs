namespace Planb.Reviews.Domain.Publishing;

/// <summary>
/// Lo que la ficha de una materia publica, ya decidido (US-129, ADR-0085). La materia **nunca se
/// reseña directo**: se deriva sumando las cursadas de sus cátedras, y una cátedra que todavía no
/// llegó al piso no aporta a ninguno de estos números.
///
/// <para>
/// La pregunta que esta ficha contesta y la de cátedra no es "¿es la materia, o es la cátedra que
/// te tocó?". Por eso el centro no son los conteos (esos ya están en cada cátedra) sino
/// <see cref="Spread"/> y <see cref="Shared"/>: qué varía entre cátedras y qué no.
/// </para>
/// </summary>
public sealed record SubjectFacts(
    bool IsPublished,
    int TotalVoices,
    int PublishingChairs,
    int ChairsBelowFloor,
    CompletionRate? Completion,
    IReadOnlyList<ChairSpread> Spread,
    IReadOnlyList<SharedTrait> Shared,
    IReadOnlyList<ChairListing> Chairs);

/// <summary>
/// Una frase donde las cátedras difieren de verdad: la respuesta depende de con quién te toque.
///
/// <para>
/// "De verdad" tiene una definición y no es una impresión: los intervalos de la cátedra más alta y
/// la más baja no se tocan (la misma regla que ADR-0083 usa para publicar un contraste). Si se
/// tocan, la diferencia puede ser del tamaño de la muestra y no se publica.
/// </para>
/// </summary>
public sealed record ChairSpread(
    string ItemCode,
    string NegativeLabel,
    IReadOnlyList<ChairShare> ByChair);

/// <summary>Cuánto marca una cátedra la opción negativa de una frase.</summary>
public sealed record ChairShare(Guid ChairId, string ChairName, int Percent, int Total);

/// <summary>
/// Una frase que **no** distingue a una cátedra de otra porque todas la marcan parejo: eso lo vuelve
/// un rasgo de la materia y no de quien la dicta. Es la otra mitad de la pregunta.
/// </summary>
public sealed record SharedTrait(
    string ItemCode,
    string NegativeLabel,
    int LowestPercent,
    int HighestPercent,
    int ChairCount);

/// <summary>
/// Una cátedra en la lista de la materia. Las que no llegan al piso aparecen igual, con su cuenta,
/// pero sin un solo conteo: esconderlas sería mentir sobre lo que hay, y adelantar sus números
/// delataría a los pocos que ya reseñaron.
/// </summary>
public sealed record ChairListing(
    Guid ChairId,
    string ChairName,
    int ReviewCount,
    bool IsPublished,
    int ReviewsMissingToPublish,
    DateTimeOffset? LastReviewedAt,
    /// <summary>
    /// La frase de conducta con la moda más marcada de esta cátedra
    /// (<see cref="SubjectChairHeadlineCalculator"/>). Null si no publica, si publica sin una sola
    /// respuesta de conducta, o si ninguna frase de conducta junta el piso de respuestas.
    /// </summary>
    SubjectChairHeadline? Headline);

/// <summary>
/// La frase de conducta con la moda más marcada de una cátedra publicada: el ítem de la capa
/// ChairConduct cuya opción más marcada pesa más, con su denominador (US-129).
///
/// <para>
/// Es la misma frase, opción y porcentaje que la ficha de esa cátedra ya publica como su moda y
/// "de N voces" (ADR-0083): esto no calcula nada nuevo, elige cuál de los que ya existen mostrar
/// en la lista de cátedras de la materia.
/// </para>
/// </summary>
public sealed record SubjectChairHeadline(string ItemCode, short OptionValue, int Percent, int Respondents);
