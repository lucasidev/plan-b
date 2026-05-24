using Planb.Identity.Domain.Users.Events;
using Wolverine;

namespace Planb.Identity.Application.IntegrationEvents;

/// <summary>
/// Local handler que traduce el in-BC <see cref="UserAccountDeactivatedDomainEvent"/> al
/// cross-BC <see cref="UserAccountDeactivatedIntegrationEvent"/> y lo publica al outbox.
/// Wolverine lo descubre por convención (método estático <c>Handle</c>).
/// </summary>
public static class UserAccountDeactivatedTranslator
{
    public static Task Handle(
        UserAccountDeactivatedDomainEvent domainEvent,
        IMessageBus bus,
        CancellationToken ct) =>
        bus.PublishAsync(new UserAccountDeactivatedIntegrationEvent(
            EventId: Guid.NewGuid(),
            UserId: domainEvent.UserId.Value,
            OccurredAt: domainEvent.OccurredAt))
            .AsTask();
}
