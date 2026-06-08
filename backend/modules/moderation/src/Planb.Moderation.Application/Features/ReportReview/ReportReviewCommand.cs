using Planb.Moderation.Domain.Reports;

namespace Planb.Moderation.Application.Features.ReportReview;

/// <summary>
/// Command for US-019 (report a review). The endpoint resolves the reporter from the JWT
/// and parses the reason string into the enum before dispatching, so the handler works
/// with a validated <see cref="ReviewReportReason"/>.
/// </summary>
public sealed record ReportReviewCommand(
    Guid ReviewId,
    Guid ReporterUserId,
    ReviewReportReason Reason,
    string? Details);
