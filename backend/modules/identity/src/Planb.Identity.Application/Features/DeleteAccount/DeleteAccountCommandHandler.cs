using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Identity.Domain.Users;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Abstractions.DomainEvents;
using Planb.SharedKernel.Primitives;

namespace Planb.Identity.Application.Features.DeleteAccount;

/// <summary>
/// Handles user self-deletion (UC-038). Steps:
/// <list type="number">
///   <item>Look up the user by id from the session claim. If gone (already deleted, or never
///     existed) return <see cref="UserErrors.NotFound"/> so the endpoint maps to <c>404</c>.</item>
///   <item>Build the immutable <see cref="UserDeletionLog"/> from the user's email. The email
///     is hashed inside the entity factory, so no plain email is persisted in the log.</item>
///   <item>Have the aggregate emit <see cref="UserAccountDeletedDomainEvent"/>; that event is
///     translated to the integration counterpart by a local handler so other BCs (when they
///     subscribe later) can clean up owned data via Wolverine's outbox.</item>
///   <item>Stage the user removal and the log insert in the unit of work. Owned collections
///     (verification tokens, student profiles) cascade by EF default for owned entities, so
///     no explicit cleanup is needed at this layer.</item>
///   <item>Dispatch domain events before <c>SaveChanges</c> so the outbox row lands in the same
///     transaction as the deletes.</item>
///   <item>After persistence, revoke any active refresh tokens. We do this last (and tolerate
///     a transient Redis failure) so a Redis hiccup doesn't kill the user-visible delete; the
///     short-lived access token still expires on its JWT clock and the next refresh attempt
///     will <c>401</c> because the user row no longer exists.</item>
/// </list>
/// </summary>
public static class DeleteAccountCommandHandler
{
    public static async Task<Result> Handle(
        DeleteAccountCommand command,
        IUserRepository users,
        IUserDeletionLogRepository deletionLogs,
        IIdentityUnitOfWork unitOfWork,
        IRefreshTokenStore refreshTokens,
        IDomainEventPublisher publisher,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var user = await users.FindByIdAsync(command.UserId, ct);
        if (user is null)
        {
            return UserErrors.NotFoundById;
        }

        var deleteResult = user.Delete(clock);
        if (deleteResult.IsFailure)
        {
            return deleteResult.Error;
        }

        var log = UserDeletionLog.Create(user.Id, user.Email, clock.UtcNow);
        deletionLogs.Add(log);

        users.Remove(user);

        // Dispatch first so the integration-event translator (and any other domain-event
        // handler) gets a chance to enroll outbox messages in the same transaction as the
        // deletes. After SaveChanges the aggregate is detached and cannot raise more events.
        await DomainEventDispatcher.DispatchAsync([user], publisher, ct);

        await unitOfWork.SaveChangesAsync(ct);

        // Best-effort: a Redis outage shouldn't roll back a successful delete. The store is
        // expected to log the transient error and let access tokens expire naturally.
        await refreshTokens.RevokeAllForUserAsync(user.Id, ct);

        return Result.Success();
    }
}
