using Planb.Reviews.Domain.Reviews.Events;
using Wolverine;

namespace Planb.Reviews.Application.IntegrationEvents;

/// <summary>
/// Local handler that translates the in-BC <see cref="ReviewDeletedDomainEvent"/> into the
/// cross-BC <see cref="ReviewDeletedIntegrationEvent"/> and publishes it to the outbox.
/// Discovered by Wolverine convention via the static <c>Handle</c> method.
/// </summary>
public static class ReviewDeletedTranslator
{
    public static Task Handle(
        ReviewDeletedDomainEvent domainEvent,
        IMessageBus bus,
        CancellationToken ct) =>
        bus.PublishAsync(new ReviewDeletedIntegrationEvent(
            EventId: Guid.NewGuid(),
            ReviewId: domainEvent.ReviewId.Value,
            EnrollmentId: domainEvent.EnrollmentId,
            DocenteResenadoId: domainEvent.DocenteResenadoId,
            StatusBefore: domainEvent.StatusBefore.ToString(),
            Reason: domainEvent.Reason.ToString(),
            OccurredAt: domainEvent.OccurredAt))
            .AsTask();
}
