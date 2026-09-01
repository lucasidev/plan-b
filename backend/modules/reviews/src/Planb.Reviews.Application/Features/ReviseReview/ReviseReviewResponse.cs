namespace Planb.Reviews.Application.Features.ReviseReview;

/// <summary>Lo que devuelve corregir: su id y cuántos ítems quedaron respondidos.</summary>
public sealed record ReviseReviewResponse(Guid Id, int AnsweredItems);
