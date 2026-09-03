using Planb.Reviews.Domain.Catalog;

namespace Planb.Reviews.Domain.Publishing;

/// <summary>
/// Lo que la ficha de una cátedra publica, ya decidido: qué se muestra y qué se calla. Es la salida
/// del cálculo editorial y la entrada de la pantalla, que solo la dibuja.
/// </summary>
public sealed record ChairFacts(
    bool IsPublished,
    int ReviewCount,
    int ReviewsMissingToPublish,
    IReadOnlyList<ConvergingFact> Fame,
    IReadOnlyList<PublishedItem> ChairConduct,
    IReadOnlyList<PublishedItem> StudentExperience,
    CompletionRate? Completion,
    IReadOnlyList<SiblingContrast> Contrasts);

/// <summary>
/// Una frase publicada: su moda como badge y su distribución completa. Nunca un promedio: "2,4 sobre
/// 3" no significa nada, y que el 59 % haya marcado "casi nunca" sí (ADR-0083).
/// </summary>
public sealed record PublishedItem(
    string ItemCode,
    string ModeLabel,
    int ModePercent,
    bool ModeIsNegative,
    int Total,
    IReadOnlyList<PublishedOption> Distribution,
    /// <summary>
    /// El tramo de antes, cuando esta frase reemplazó a otra y esa otra tiene respuestas de este
    /// sujeto (US-198, E3). Va colgado de la frase de hoy y no como una fila más de la lista, porque
    /// eso es lo que es: la misma pregunta antes de dejar de ser la misma. Nunca se suma con el
    /// tramo nuevo, y no alimenta ni la fama ni los contrastes.
    /// </summary>
    PublishedItem? PreviousSeries = null,
    /// <summary>
    /// Cuándo dejó de preguntarse. Solo lo trae un tramo viejo: es la fecha en que la serie se
    /// cortó, y sin ella la ficha puede decir que dos tramos no se comparan pero no desde cuándo.
    /// </summary>
    DateTimeOffset? RetiredAt = null);

/// <summary>Un segmento de la distribución: su etiqueta, su porcentaje y de qué lado cae.</summary>
public sealed record PublishedOption(string Label, int Percent, OptionValence Valence);

/// <summary>
/// La fama del sujeto: varias frases distintas apuntando al mismo lado. Es lo primero que la ficha
/// dice, porque tres frases convergentes valen más que quinientas marcas en una sola.
/// </summary>
public sealed record ConvergingFact(IReadOnlyList<string> ItemCodes, int ItemsAgreeing);

/// <summary>
/// De cada diez que la cursan, cuántas llegan (aprobada o regular). Se publica solo agregada: el
/// desenlace de una persona no se muestra jamás.
/// </summary>
public sealed record CompletionRate(int Reaching, int Total, int OutOfTen);

/// <summary>
/// Un contraste contra las cátedras hermanas de la misma materia, ya filtrado por la regla de
/// publicación: si está acá, es porque los intervalos no se tocan.
/// </summary>
public sealed record SiblingContrast(
    string ItemCode,
    int HerePercent,
    int HereCount,
    int HereTotal,
    int SiblingsPercent,
    int SiblingsCount,
    int SiblingsTotal);
