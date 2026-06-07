using Planb.Reviews.Domain.Reviews.Events;
using Wolverine;

namespace Planb.Reviews.Application.IntegrationEvents;

/// <summary>
/// Local handler that translates the in-BC <see cref="ReviewEditedDomainEvent"/> into the
/// cross-BC <see cref="ReviewEditedIntegrationEvent"/> and publishes it to the outbox.
/// Discovered by Wolverine convention via the static <c>Handle</c> method.
/// </summary>
public static class ReviewEditedTranslator
{
    public static Task Handle(
        ReviewEditedDomainEvent domainEvent,
        IMessageBus bus,
        CancellationToken ct) =>
        bus.PublishAsync(new ReviewEditedIntegrationEvent(
            EventId: Guid.NewGuid(),
            ReviewId: domainEvent.ReviewId.Value,
            EnrollmentId: domainEvent.EnrollmentId,
            DocenteResenadoId: domainEvent.DocenteResenadoId,
            StatusBefore: domainEvent.StatusBefore.ToString(),
            StatusAfter: domainEvent.StatusAfter.ToString(),
            OccurredAt: domainEvent.OccurredAt))
            .AsTask();
}
