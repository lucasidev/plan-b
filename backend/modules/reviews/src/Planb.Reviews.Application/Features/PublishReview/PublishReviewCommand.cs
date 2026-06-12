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
/// Validar "el docente reseñado estaba en la commission del enrollment" requiere los
/// aggregates <c>Commission</c> + <c>Teacher</c> + <c>CommissionTeacher</c> en Academic, que
/// todavía no aterrizaron. Mientras tanto se acepta el <see cref="DocenteResenadoId"/> tal
/// cual viene del request; cuando aterrice ese contract, se agrega la validación acá sin
/// cambiar la firma del command.
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
