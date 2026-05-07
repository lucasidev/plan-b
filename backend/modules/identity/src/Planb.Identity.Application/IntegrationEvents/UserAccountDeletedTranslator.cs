using Planb.Identity.Domain.Users.Events;
using Wolverine;

namespace Planb.Identity.Application.IntegrationEvents;

/// <summary>
/// Local handler that translates the in-BC <see cref="UserAccountDeletedDomainEvent"/> into
/// the cross-BC <see cref="UserAccountDeletedIntegrationEvent"/> and publishes it to the
/// outbox. Wolverine discovers this by convention (static <c>Handle</c> method whose first
/// parameter is the event type).
/// <para>
/// The translation strips the email — only the <see cref="UserAccountDeletedDomainEvent.UserId"/>
/// crosses module boundaries. Owning consumers (Reviews, Enrollments, Moderation, when those
/// BCs land) only need the id to delete their user-owned data; sending the email would leak
/// PII unnecessarily and contradict the purpose of the deletion (Ley 25.326 art. 6).
/// </para>
/// </summary>
public static class UserAccountDeletedTranslator
{
    public static Task Handle(
        UserAccountDeletedDomainEvent domainEvent,
        IMessageBus bus,
        CancellationToken ct) =>
        bus.PublishAsync(new UserAccountDeletedIntegrationEvent(
            EventId: Guid.NewGuid(),
            UserId: domainEvent.UserId.Value,
            OccurredAt: domainEvent.OccurredAt))
            .AsTask();
}
