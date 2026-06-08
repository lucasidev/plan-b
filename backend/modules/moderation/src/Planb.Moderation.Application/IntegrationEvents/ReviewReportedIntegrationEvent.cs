using Planb.SharedKernel.Abstractions.Messaging;

namespace Planb.Moderation.Application.IntegrationEvents;

/// <summary>
/// Cross-BC announcement that a review was reported (US-019). Owned by Moderation (the
/// publisher) since it is a fact about the moderation domain. Useful for future consumers:
/// notifications to staff, report dashboards (US-020), metrics. No consumer is wired yet;
/// it is emitted so the outbox trail exists from day one.
/// </summary>
public sealed record ReviewReportedIntegrationEvent(
    Guid EventId,
    Guid ReportId,
    Guid ReviewId,
    Guid ReporterUserId,
    string Reason,
    int OpenReportCount,
    DateTimeOffset OccurredAt) : IIntegrationEvent;
