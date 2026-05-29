namespace Planb.Reviews.Application.Abstractions.ContentFilter;

/// <summary>
/// Evalúa el contenido de una reseña antes de publicarla. Determina si la review puede ir
/// directo a <c>Published</c> o si necesita pasar primero por <c>UnderReview</c> para
/// inspección humana. El filter NO es la última palabra de moderación, es una heurística que
/// alivia la cola del moderator humano: cuando el filter marca <c>Triggered</c>, el
/// moderator decide; cuando marca <c>Clean</c>, la review queda publicada y solo entra a
/// moderation si llegan reports (ver ADR-0010 + US-019).
///
/// Implementación inicial (US-017): regex de blacklist + length validators. Cuando crezca el
/// corpus de falsos positivos / falsos negativos, ahí evaluamos una capa adicional (ML
/// classifier, ngrams, etc).
/// </summary>
public interface IReviewContentFilter
{
    /// <summary>
    /// Evalúa el contenido combinado de los textos de la review. Los nulls se ignoran al
    /// concatenar; al menos uno tiene que estar presente (invariante validada al construir
    /// el aggregate, no acá).
    /// </summary>
    ContentFilterResult Evaluate(string? subjectText, string? teacherText);
}
