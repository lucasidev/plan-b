namespace Planb.Moderation.Application.Features.ReportReview;

/// <summary>
/// Response of POST /api/reviews/{id}/reports. Returns the created report id + whether the
/// open-report threshold was reached (so the client could surface "this review is now under
/// review", though the modal just confirms the report landed).
/// </summary>
public sealed record ReportReviewResponse(
    Guid ReportId,
    bool ThresholdReached);
