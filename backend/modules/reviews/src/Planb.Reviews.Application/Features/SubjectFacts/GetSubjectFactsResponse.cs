namespace Planb.Reviews.Application.Features.SubjectFacts;

/// <summary>
/// La ficha de una materia tal como la pantalla la dibuja (US-129, ADR-0085).
///
/// <para>
/// Una materia **nunca se reseña directo**: todo lo que viaja acá se derivó sumando las cursadas de
/// sus cátedras, y solo de las que cruzaron el piso. Por eso el centro de la ficha no son los
/// conteos (esos ya están en cada cátedra) sino <see cref="Spread"/> y <see cref="Shared"/>: qué
/// varía entre cátedras y qué es de la materia se dictara con quien se dictara.
/// </para>
/// </summary>
public sealed record GetSubjectFactsResponse(
    Guid SubjectId,
    string SubjectCode,
    string SubjectName,
    int YearInPlan,
    bool IsPublished,
    int TotalVoices,
    int PublishingChairs,
    int ChairsBelowFloor,
    SubjectSpanView? Span,
    DistributionView? Attempts,
    SubjectCompletionView? Completion,
    int EnablesCount,
    IReadOnlyList<SpreadView> Spread,
    IReadOnlyList<SharedView> Shared,
    IReadOnlyList<TakenWithView> TakenWith,
    IReadOnlyList<SubjectChairView> Chairs);

/// <summary>
/// Con qué otra materia se llevó esta, en un período, y cómo les fue a los que las llevaron juntas
/// (US-143).
///
/// <para>
/// Es el dato que la lapicera no puede calcular: armar el horario lo resuelve cualquiera, saber que
/// 18 de 40 dejaron una de las dos no lo resuelve nadie solo. Tiene su propio piso por par y
/// período, así que un par puede no publicar aunque la materia sí.
/// </para>
/// </summary>
public sealed record TakenWithView(
    Guid SubjectId,
    string SubjectName,
    string SubjectCode,
    int TogetherCount,
    int DroppedCount,
    bool IsPublished,
    int MissingToPublish);

/// <summary>Entre qué años se cursó lo que esta ficha resume.</summary>
public sealed record SubjectSpanView(int FromYear, int ToYear);

/// <summary>
/// La distribución de una frase, con su moda y sus tramos.
///
/// <para>
/// Es distribución y no promedio: la ficha de pantalla pedía "2,1 intentos", y esa forma no
/// sobrevive porque la última opción de la frase es abierta ("tres o más"), así que el promedio
/// subestima siempre y por un margen que nadie puede recalcular.
/// </para>
///
/// <para>
/// <see cref="OpenEnded"/> es justamente esa opción, separada del resto para que la pantalla la
/// diga sola. Es la gente a la que le costó: la que el promedio taparía y el dato existe para
/// mostrar.
/// </para>
/// </summary>
public sealed record DistributionView(
    string Code,
    string Text,
    string ModeLabel,
    int ModePercent,
    int Total,
    IReadOnlyList<SliceView> Options,
    SliceView? OpenEnded);

public sealed record SliceView(string Label, int Percent, bool IsNegative);

/// <summary>De cada diez que la cursan, cuántas llegan. Agregada sobre todas sus cátedras.</summary>
public sealed record SubjectCompletionView(int OutOfTen, int Reaching, int Total);

/// <summary>
/// Una frase donde las cátedras difieren de verdad: la respuesta depende de con quién te toque. Solo
/// aparece si los intervalos de la más alta y la más baja no se tocan.
/// </summary>
public sealed record SpreadView(
    string ItemCode,
    string ItemText,
    string NegativeLabel,
    IReadOnlyList<ChairShareView> ByChair);

/// <summary>Cuánto marca una cátedra la opción negativa de una frase, con su denominador.</summary>
public sealed record ChairShareView(Guid ChairId, string ChairName, int Percent, int Total);

/// <summary>
/// Una frase que todas las cátedras marcan parejo y fuerte: eso lo vuelve un rasgo de la materia y no
/// de quien la dicta.
/// </summary>
public sealed record SharedView(
    string ItemCode,
    string ItemText,
    string NegativeLabel,
    int LowestPercent,
    int HighestPercent,
    int ChairCount);

/// <summary>
/// Una cátedra en la lista de la materia. Las que no llegan al piso vienen con su cuenta y lo que
/// les falta, y sin un solo conteo.
/// </summary>
public sealed record SubjectChairView(
    Guid ChairId,
    string ChairName,
    int ReviewCount,
    bool IsPublished,
    int ReviewsMissingToPublish,
    DateTimeOffset? LastReviewedAt);
