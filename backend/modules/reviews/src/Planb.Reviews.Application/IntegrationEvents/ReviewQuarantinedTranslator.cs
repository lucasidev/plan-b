using Planb.Reviews.Domain.Reviews.Events;
using Wolverine;

namespace Planb.Reviews.Application.IntegrationEvents;

/// <summary>
/// Local handler que traduce el in-BC <see cref="ReviewQuarantinedDomainEvent"/> al cross-BC
/// <see cref="ReviewQuarantinedIntegrationEvent"/>.
/// </summary>
public static class ReviewQuarantinedTranslator
{
    public static Task Handle(
        ReviewQuarantinedDomainEvent domainEvent,
        IMessageBus bus,
        CancellationToken ct) =>
        bus.PublishAsync(new ReviewQuarantinedIntegrationEvent(
            EventId: Guid.NewGuid(),
            ReviewId: domainEvent.ReviewId.Value,
            EnrollmentId: domainEvent.EnrollmentId,
            DocenteResenadoId: domainEvent.DocenteResenadoId,
            OccurredAt: domainEvent.OccurredAt))
            .AsTask();
}
