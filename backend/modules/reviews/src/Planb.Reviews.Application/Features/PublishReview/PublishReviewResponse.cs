namespace Planb.Reviews.Application.Features.PublishReview;

/// <summary>
/// Lo que devuelve publicar una reseña: su id y cuántas frases respondió.
///
/// <para>
/// No trae nada de lo respondido, ni conteos de la ficha: la reseña individual no se muestra nunca
/// (ADR-0083), y el estado de la ficha (si ya cruzó el piso de 10, cuántas voces junta) lo pide la
/// pantalla a la ficha, que es su dueña. El id existe para que el autor pueda editarla o borrarla.
/// </para>
/// </summary>
public sealed record PublishReviewResponse(Guid Id, int AnsweredItems);
