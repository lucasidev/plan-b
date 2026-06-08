namespace Planb.Moderation.Application.Features.ReportReview;

/// <summary>
/// Body of POST /api/reviews/{id}/reports (US-019). <c>reason</c> is the string form of
/// <see cref="Domain.Reports.ReviewReportReason"/> (e.g. "Spam", "DatosPersonales").
/// <c>details</c> is optional free text (max 2000 chars).
/// </summary>
public sealed record ReportReviewRequest(
    string Reason,
    string? Details);
