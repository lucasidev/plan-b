namespace Planb.Reviews.Application.Features.ReviseCourseReview;

/// <summary>Lo que devuelve corregir: su id y cuántos ítems quedaron respondidos.</summary>
public sealed record ReviseCourseReviewResponse(Guid Id, int AnsweredItems);
