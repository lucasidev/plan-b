namespace Planb.Reviews.Application.Features.RespondToReview;

/// <summary>
/// Respuesta de POST /api/reviews/{id}/teacher-response (US-040). Devuelve el texto publicado + el
/// docente que respondió + cuándo. El mismo body sale en el reintento idempotente.
/// </summary>
public sealed record RespondToReviewResponse(
    Guid ReviewId, Guid TeacherId, string Text, DateTimeOffset CreatedAt);
