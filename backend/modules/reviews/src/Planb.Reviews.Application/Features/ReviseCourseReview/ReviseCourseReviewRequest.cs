namespace Planb.Reviews.Application.Features.ReviseCourseReview;

/// <summary>
/// Body de <c>PUT /api/reviews/cursadas/{id}</c>. Trae lo que queda respondido después de editar,
/// completo: lo que no viene, deja de contarse.
/// </summary>
public sealed record ReviseCourseReviewRequest(
    IReadOnlyList<ReviseAnswerRequest>? Answers,
    string? FreeText);

public sealed record ReviseAnswerRequest(string ItemCode, short OptionValue);
