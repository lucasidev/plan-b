namespace Planb.Reviews.Application.Features.PublishCourseReview;

/// <summary>
/// Body de <c>POST /api/reviews/cursadas</c>. La cuenta sale del token, no del body: nadie reseña
/// en nombre de otro.
/// </summary>
public sealed record PublishCourseReviewRequest(
    Guid SubjectId,
    Guid TermId,
    Guid? ChairId,
    IReadOnlyList<CourseReviewAnswerRequest>? Answers,
    string? FreeText);

/// <summary>Una respuesta del cuestionario: el código del ítem y el valor de la opción elegida.</summary>
public sealed record CourseReviewAnswerRequest(string ItemCode, short OptionValue);
