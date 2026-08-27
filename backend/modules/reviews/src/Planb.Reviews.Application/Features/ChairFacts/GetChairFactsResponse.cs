using Planb.Reviews.Domain.Catalog;

namespace Planb.Reviews.Application.Features.ChairFacts;

/// <summary>
/// La ficha de una cátedra tal como la pantalla la dibuja (ADR-0083).
///
/// <para>
/// Lo que este contrato NO tiene es tan importante como lo que tiene: ninguna reseña individual,
/// ningún autor, ningún desenlace de una persona (US-148). Lo único que viaja son conteos y las
/// etiquetas literales que se eligieron, más el texto de cada ítem para poder enunciarlo.
/// </para>
///
/// <para>
/// Cuando <see cref="IsPublished"/> es false, todas las secciones vienen vacías y lo único con
/// contenido es <see cref="ReviewsMissingToPublish"/>: bajo el piso la ficha existe y dice cuánto
/// le falta, en vez de fingir que la cátedra no existe.
/// </para>
/// </summary>
public sealed record GetChairFactsResponse(
    Guid ChairId,
    string ChairName,
    Guid SubjectId,
    string SubjectName,
    string SubjectCode,
    string? LeadTeacherName,
    bool IsPublished,
    int ReviewCount,
    int ReviewsMissingToPublish,
    SpanView? Span,
    FameView? Fame,
    IReadOnlyList<PublishedItemView> ChairConduct,
    IReadOnlyList<PublishedItemView> StudentExperience,
    CompletionView? Completion,
    IReadOnlyList<ContrastView> Contrasts);

/// <summary>
/// De cuándo son las voces que esta ficha publica: entre qué años se cursó lo que se reseñó, y
/// cuándo entró la última reseña.
///
/// <para>
/// Es sustento, no adorno. Un conteo sin su ventana temporal no dice si describe a la cátedra de
/// hoy o a la de hace cinco años, y esa diferencia es justamente lo que un cambio de titular hace
/// relevante.
/// </para>
/// </summary>
public sealed record SpanView(int FromYear, int ToYear, DateTimeOffset? LastReviewedAt);

/// <summary>
/// La fama: los ítems que apuntan al mismo lado, cada uno con lo que se eligió y cuánto pesa.
///
/// <para>
/// Viaja con texto y porcentaje porque la pantalla la enuncia con su sustento a la vista ("el 80 %
/// dijo que casi nunca le contestaban"), no como una etiqueta suelta: la afirmación de arriba tiene
/// que poder verificarse sin bajar al detalle.
/// </para>
/// </summary>
public sealed record FameView(int ItemsAgreeing, IReadOnlyList<FameItemView> Items);

/// <summary>Un ítem de la convergencia: qué se preguntó, qué se eligió y cuántos.</summary>
public sealed record FameItemView(string Code, string Text, string NegativeLabel, int Percent);

/// <summary>
/// Un ítem publicado: qué se preguntó, qué contestó la mayoría y cómo se repartió el resto.
/// </summary>
public sealed record PublishedItemView(
    string Code,
    string Text,
    string ModeLabel,
    int ModePercent,
    bool ModeIsNegative,
    int Total,
    IReadOnlyList<DistributionSliceView> Distribution);

/// <summary>
/// Un tramo de la distribución. Lleva <see cref="IsNegative"/> y no la valencia cruda: la pantalla
/// solo necesita saber qué se pinta de alarma, y este es el único read del producto que lo dice
/// (el del cuestionario, deliberadamente, no).
/// </summary>
public sealed record DistributionSliceView(string Label, int Percent, bool IsNegative);

/// <summary>De cada diez que la cursan, cuántas llegan. Solo agregada, nunca por persona.</summary>
public sealed record CompletionView(int OutOfTen, int Reaching, int Total);

/// <summary>
/// Un contraste contra las hermanas que sobrevivió la regla de los intervalos separados. Si está
/// acá, la diferencia no se explica por el tamaño de la muestra.
/// </summary>
public sealed record ContrastView(
    string ItemCode,
    string ItemText,
    string NegativeLabel,
    int HerePercent,
    int HereTotal,
    int SiblingsPercent,
    int SiblingsTotal);

/// <summary>
/// Lo mínimo del catálogo que la respuesta necesita para hablar en castellano: el texto del ítem y
/// la etiqueta de su opción negativa. El dominio devuelve códigos, que son identidad y no idioma.
/// </summary>
public sealed record ItemCopy(string Code, string Text, string? NegativeLabel, ItemLayer Layer);
