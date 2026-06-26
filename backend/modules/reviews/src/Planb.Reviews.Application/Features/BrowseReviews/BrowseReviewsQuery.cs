namespace Planb.Reviews.Application.Features.BrowseReviews;

/// <summary>
/// Optional filters for the public feed (US-048 tab Explorar). All fields nullable: an
/// absent filter means "any value". Page is 1-indexed for human-friendly URLs;
/// <c>PageSize</c> is bounded in the endpoint to prevent the client from asking for huge
/// pages.
///
/// <c>TeacherId</c> filtra por <c>docente_reseñado_id</c>: lo consume la página de docente
/// (US-003), que lista las reseñas donde el docente fue el reseñado, con el contexto de materia
/// (code/name) que el join ya trae. Los filtros por rating y tags del AC de US-048 siguen
/// pendientes del rework correspondiente.
/// </summary>
public sealed record BrowseReviewsQuery(
    Guid? SubjectId,
    Guid? CareerPlanId,
    int? DifficultyRating,
    Guid? TeacherId,
    int Page,
    int PageSize,
    // Caller autenticado (o null si anónimo). Solo se usa para resolver "mi voto" por reseña;
    // no filtra el listado (el feed es el mismo para todos).
    Guid? CurrentUserId);
