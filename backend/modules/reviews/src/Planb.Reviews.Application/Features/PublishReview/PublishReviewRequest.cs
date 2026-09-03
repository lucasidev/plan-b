namespace Planb.Reviews.Application.Features.PublishReview;

/// <summary>
/// Body de <c>POST /api/reviews/courses</c>. La cuenta sale del token, no del body: nadie reseña
/// en nombre de otro.
/// </summary>
public sealed record PublishReviewRequest(
    Guid SubjectId,
    Guid TermId,
    Guid? ChairId,
    IReadOnlyList<ReviewAnswerRequest>? Answers,
    string? FreeText);

/// <summary>Una respuesta del cuestionario: el código de la frase y el valor de la opción elegida.</summary>
public sealed record ReviewAnswerRequest(string ItemCode, short OptionValue);
