namespace Planb.Reviews.Application.Features.ReviseReview;

/// <summary>
/// Body de <c>PUT /api/reviews/courses/{id}</c>. Trae lo que queda respondido después de editar,
/// completo: lo que no viene, deja de contarse.
/// </summary>
public sealed record ReviseReviewRequest(
    IReadOnlyList<ReviseAnswerRequest>? Answers,
    string? FreeText);

public sealed record ReviseAnswerRequest(string ItemCode, short OptionValue);
