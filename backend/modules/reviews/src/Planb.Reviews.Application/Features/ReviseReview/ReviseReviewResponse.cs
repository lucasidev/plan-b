namespace Planb.Reviews.Application.Features.ReviseReview;

/// <summary>Lo que devuelve editar: su id y cuántas frases quedaron respondidas.</summary>
public sealed record ReviseReviewResponse(Guid Id, int AnsweredItems);
