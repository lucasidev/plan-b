namespace Planb.Reviews.Application.Abstractions.Persistence;

/// <summary>
/// Lo que una cuenta aportó, para que pueda verlo, corregirlo o borrarlo (US-165, US-166).
///
/// <para>
/// Devuelve reseñas de a una y solo se lo puede pedir su autor. Todo lo que el producto
/// <b>publica</b> es agregado: la ficha nunca muestra una reseña individual, ni siquiera anónima
/// (ADR-0083). El otro read que devuelve de a una es el del campo libre para la curaduría
/// (<see cref="IFreeTextQueryService"/>), que tampoco publica nada y no trae la cuenta.
/// </para>
/// </summary>
public interface IMyReviewsQueryService
{
    /// <summary>
    /// Las reseñas crudas de una cuenta: todo lo que <c>reviews</c> sabe, y nada del catálogo.
    /// Los nombres los compone el handler pidiéndoselos a academic por contrato.
    /// </summary>
    Task<IReadOnlyList<MyReviewRow>> ListAsync(
        Guid accountId, CancellationToken ct = default);
}

/// <summary>
/// Una reseña propia como la guarda este módulo: ids del catálogo, no nombres. Es lo que permite
/// que la consulta no salga del schema <c>reviews</c>.
/// </summary>
public sealed record MyReviewRow(
    Guid Id,
    Guid SubjectId,
    Guid TermId,
    Guid? ChairId,
    IReadOnlyList<MyAnswerView> Answers,
    string? FreeText,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

/// <summary>
/// Una reseña propia como la ve su autor: qué cursada fue, cuánto respondió y qué escribió.
///
/// <para>
/// Trae el texto libre porque es de quien lo escribió y tiene derecho a releerlo antes de decidir
/// si lo deja; lo que nunca pasa es que ese texto salga publicado (ADR-0084).
/// </para>
/// </summary>
public sealed record MyReviewView(
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
