namespace Planb.Reviews.Application.Features.RespondToReview;

/// <summary>Body de POST /api/reviews/{id}/teacher-response (US-040).</summary>
public sealed record RespondToReviewRequest(string Text);
