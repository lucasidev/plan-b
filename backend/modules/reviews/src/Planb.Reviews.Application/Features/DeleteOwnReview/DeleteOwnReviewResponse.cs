namespace Planb.Reviews.Application.Features.DeleteOwnReview;

/// <summary>
/// Body returned by DELETE /api/me/reviews/{id} (US-055). Returns the review's final
/// state so the client can confirm the soft delete landed. Idempotent: a second call
/// returns the same body with the already-deleted state.
/// </summary>
public sealed record DeleteOwnReviewResponse(
    Guid Id,
    string Status,
    DateTimeOffset? DeletedAt);
