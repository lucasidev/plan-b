namespace Planb.Reviews.Application.Abstractions.ContentFilter;

/// <summary>
/// Resultado de la evaluación del filter de contenido (<see cref="IReviewContentFilter"/>).
///
/// <list type="bullet">
///   <item><c>Verdict</c>: discriminación binaria. <c>Clean</c> deja publicar; <c>Triggered</c>
///         manda a <c>UnderReview</c>.</item>
///   <item><c>TriggeredRules</c>: identificadores de las reglas que dispararon. Vacío si
///         <c>Clean</c>. Se persiste opcionalmente en el audit log para que el moderator
///         entienda rápido qué fue lo que sospechó el filter sin tener que releer todo el
///         texto.</item>
/// </list>
/// </summary>
public sealed record ContentFilterResult(
    ContentFilterVerdict Verdict,
    IReadOnlyList<string> TriggeredRules)
{
    public static ContentFilterResult Clean() => new(ContentFilterVerdict.Clean, []);

    public static ContentFilterResult Triggered(IReadOnlyList<string> rules) =>
        new(ContentFilterVerdict.Triggered, rules);
}

public enum ContentFilterVerdict
{
    Clean,
    Triggered,
}
