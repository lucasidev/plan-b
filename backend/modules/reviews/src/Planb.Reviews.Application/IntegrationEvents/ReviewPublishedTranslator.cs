using Planb.Reviews.Domain.Reviews.Events;
using Wolverine;

namespace Planb.Reviews.Application.IntegrationEvents;

/// <summary>
/// Local handler que traduce el in-BC <see cref="ReviewPublishedDomainEvent"/> al cross-BC
/// <see cref="ReviewPublishedIntegrationEvent"/> y lo publica al outbox. Wolverine lo descubre
/// por convención (método estático <c>Handle</c>).
/// </summary>
public static class ReviewPublishedTranslator
{
    public static Task Handle(
        ReviewPublishedDomainEvent domainEvent,
        IMessageBus bus,
        CancellationToken ct) =>
        bus.PublishAsync(new ReviewPublishedIntegrationEvent(
            EventId: Guid.NewGuid(),
            ReviewId: domainEvent.ReviewId.Value,
            EnrollmentId: domainEvent.EnrollmentId,
            DocenteResenadoId: domainEvent.DocenteResenadoId,
            OccurredAt: domainEvent.OccurredAt))
            .AsTask();
}
