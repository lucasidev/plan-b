namespace Planb.Reviews.Application.Abstractions.Persistence;

/// <summary>
/// Lo que una cuenta aportó, para que pueda verlo, corregirlo o borrarlo (US-165, US-166).
///
/// <para>
/// Es el único read del producto que devuelve reseñas de a una, y solo se lo puede pedir su
/// autor. Todo lo demás que el producto publica es agregado: la ficha nunca muestra una reseña
/// individual, ni siquiera anónima (ADR-0083).
/// </para>
/// </summary>
public interface IMyCourseReviewsQueryService
{
    Task<IReadOnlyList<MyCourseReviewView>> ListAsync(
        Guid accountId, CancellationToken ct = default);
}

/// <summary>
/// Una reseña propia como la ve su autor: qué cursada fue, cuánto respondió y qué escribió.
///
/// <para>
/// Trae el texto libre porque es de quien lo escribió y tiene derecho a releerlo antes de decidir
/// si lo deja; lo que nunca pasa es que ese texto salga publicado (ADR-0084).
/// </para>
/// </summary>
public sealed record MyCourseReviewView(
    Guid Id,
    Guid SubjectId,
    string SubjectName,
    string SubjectCode,
    Guid TermId,
    string TermLabel,
    Guid? ChairId,
    string? ChairName,
    int AnsweredItems,
    IReadOnlyList<MyAnswerView> Answers,
    string? FreeText,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

/// <summary>
/// Una respuesta propia: qué ítem y qué opción eligió.
///
/// <para>
/// Viaja solo acá, y solo hacia quien la escribió. Que nadie más pueda ver una respuesta individual
/// es la garantía del producto (ADR-0083); que su autor pueda verla es lo que hace posible
/// corregirla sin tener que contestar todo de nuevo.
/// </para>
/// </summary>
public sealed record MyAnswerView(string ItemCode, short OptionValue);
