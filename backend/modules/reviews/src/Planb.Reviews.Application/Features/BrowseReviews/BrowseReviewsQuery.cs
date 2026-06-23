namespace Planb.Reviews.Application.Features.BrowseReviews;

/// <summary>
/// Optional filters for the public feed (US-048 tab Explorar). All fields nullable: an
/// absent filter means "any value". Page is 1-indexed for human-friendly URLs;
/// <c>PageSize</c> is bounded in the endpoint to prevent the client from asking for huge
/// pages.
///
/// Only `subjectId`, `careerPlanId` and `difficultyRating` are surfaced in this PR. The
/// US-048 AC mentions filters by docente (Teacher), rating and tags too, but those
/// require either the Teacher aggregate in Academic or the Review model rework. We add
/// them when those land.
/// </summary>
public sealed record BrowseReviewsQuery(
    Guid? SubjectId,
    Guid? CareerPlanId,
    int? DifficultyRating,
    int Page,
    int PageSize,
    // Caller autenticado (o null si anónimo). Solo se usa para resolver "mi voto" por reseña;
    // no filtra el listado (el feed es el mismo para todos).
    Guid? CurrentUserId);
