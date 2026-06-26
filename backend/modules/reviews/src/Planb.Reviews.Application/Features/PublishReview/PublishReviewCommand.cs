namespace Planb.Reviews.Application.Features.PublishReview;

/// <summary>
/// Publicar una reseña sobre una cursada finalizada (US-017).
///
/// El <see cref="UserId"/> lo extrae el endpoint del JWT (claim <c>sub</c>) y lo pasa explícito.
/// El handler:
///   1) resuelve el <c>StudentProfileSummary</c> del user (cross-BC Identity),
///   2) trae el <c>EnrollmentSummary</c> y valida ownership + status,
///   3) idempotency: ya hay reseña para este enrollment,
///   4) corre el filter de contenido,
///   5) construye el aggregate <c>Review.Publish</c> y persiste.
///
/// <para>
/// El handler valida que el <see cref="DocenteResenadoId"/> esté asignado a la commission de la
/// cursada (cross-BC vía <c>IAcademicQueryService.GetCommissionTeachersAsync</c>), invariante del
/// data-model: no se reseña a un docente que no dictó esa comisión.
/// </para>
/// </summary>
public sealed record PublishReviewCommand(
    Guid UserId,
    Guid EnrollmentId,
    Guid DocenteResenadoId,
    int DifficultyRating,
    int OverallRating,
    int? HoursPerWeek,
    IReadOnlyList<string> Tags,
    bool WouldRecommendCourse,
    bool WouldRetakeTeacher,
    string? SubjectText,
    string? TeacherText,
    decimal? FinalGrade);
