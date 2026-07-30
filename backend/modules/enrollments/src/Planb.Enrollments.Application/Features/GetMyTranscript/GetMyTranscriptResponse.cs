namespace Planb.Enrollments.Application.Features.GetMyTranscript;

/// <summary>
/// Response payload of GET /api/me/enrollment-records. A wrapper around the list so future
/// fields (e.g. a last-refreshed timestamp) can be added without breaking the JSON shape. Same
/// rationale as GetMyPendingReviewsResponse in Reviews.
/// </summary>
public sealed record GetMyTranscriptResponse(IReadOnlyList<TranscriptPeriod> Periods);
