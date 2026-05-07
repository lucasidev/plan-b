using NSubstitute;
using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Identity.Application.Features.DeleteAccount;
using Planb.Identity.Domain.Users;
using Planb.Identity.Domain.Users.Events;
using Planb.Identity.Tests.Users;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Abstractions.DomainEvents;
using Shouldly;
using Xunit;

namespace Planb.Identity.Tests.Features;

/// <summary>
/// Handler unit tests for <see cref="DeleteAccountCommandHandler"/>. Covers:
/// <list type="bullet">
///   <item>User not found → <see cref="UserErrors.NotFoundById"/>, no side effects.</item>
///   <item>Happy path → user removed, deletion log added, event dispatched, refresh tokens
///     revoked AFTER persistence.</item>
///   <item>Order of operations: dispatch → save → revoke. The revoke runs last so a Redis
///     hiccup doesn't block a successful delete.</item>
/// </list>
/// </summary>
public class DeleteAccountCommandHandlerTests
{
    private static readonly DateTimeOffset T0 = new(2026, 5, 7, 12, 0, 0, TimeSpan.Zero);

    private static EmailAddress Email(string raw = "lucia@unsta.edu.ar") =>
        EmailAddress.Create(raw).Value;

    private static User VerifiedActiveUser(FixedClock clock)
    {
        var user = User.Register(Email(), "hashed", clock).Value;
        user.IssueVerificationToken(
            TokenPurpose.UserEmailVerification, "verify", TimeSpan.FromHours(24), clock);
        user.VerifyEmail("verify", clock);
        user.ClearDomainEvents();
        return user;
    }

    private sealed record Deps(
        IUserRepository Users,
        IUserDeletionLogRepository DeletionLogs,
        IIdentityUnitOfWork UnitOfWork,
        IRefreshTokenStore RefreshTokens,
        IDomainEventPublisher Publisher,
        FixedClock Clock);

    private static Deps NewDeps() => new(
        Substitute.For<IUserRepository>(),
        Substitute.For<IUserDeletionLogRepository>(),
        Substitute.For<IIdentityUnitOfWork>(),
        Substitute.For<IRefreshTokenStore>(),
        Substitute.For<IDomainEventPublisher>(),
        new FixedClock(T0));

    [Fact]
    public async Task Handle_returns_NotFoundById_when_user_missing()
    {
        var deps = NewDeps();
        deps.Users.FindByIdAsync(Arg.Any<UserId>(), Arg.Any<CancellationToken>())
            .Returns((User?)null);

        var result = await DeleteAccountCommandHandler.Handle(
            new DeleteAccountCommand(UserId.New()),
            deps.Users, deps.DeletionLogs, deps.UnitOfWork,
            deps.RefreshTokens, deps.Publisher, deps.Clock,
            CancellationToken.None);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.NotFoundById);

        // No side effects when the user doesn't exist.
        deps.Users.DidNotReceive().Remove(Arg.Any<User>());
        deps.DeletionLogs.DidNotReceive().Add(Arg.Any<UserDeletionLog>());
        await deps.UnitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
        await deps.RefreshTokens.DidNotReceive().RevokeAllForUserAsync(
            Arg.Any<UserId>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_happy_path_removes_user_logs_deletion_dispatches_event_and_revokes()
    {
        var deps = NewDeps();
        var user = VerifiedActiveUser(deps.Clock);
        deps.Users.FindByIdAsync(user.Id, Arg.Any<CancellationToken>()).Returns(user);

        var result = await DeleteAccountCommandHandler.Handle(
            new DeleteAccountCommand(user.Id),
            deps.Users, deps.DeletionLogs, deps.UnitOfWork,
            deps.RefreshTokens, deps.Publisher, deps.Clock,
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();

        // User staged for removal.
        deps.Users.Received(1).Remove(user);

        // Deletion log written with the user's id and a hashed email.
        deps.DeletionLogs.Received(1).Add(Arg.Is<UserDeletionLog>(log =>
            log.UserId == user.Id &&
            log.EmailHash == UserDeletionLog.HashEmail(user.Email) &&
            log.DeletedAt == T0));

        // Domain event dispatched (the translator turns it into the integration event in the
        // outbox; this test verifies only the dispatch happened, integration coverage handles
        // the actual outbox enqueue).
        await deps.Publisher.Received().PublishAsync(
            Arg.Is<UserAccountDeletedDomainEvent>(e => e.UserId == user.Id),
            Arg.Any<CancellationToken>());

        await deps.UnitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());

        // Refresh tokens revoked after persistence.
        await deps.RefreshTokens.Received(1).RevokeAllForUserAsync(
            user.Id, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_revokes_refresh_tokens_after_save_not_before()
    {
        var deps = NewDeps();
        var user = VerifiedActiveUser(deps.Clock);
        deps.Users.FindByIdAsync(user.Id, Arg.Any<CancellationToken>()).Returns(user);

        // Track call order: SaveChangesAsync must precede RevokeAllForUserAsync.
        var calls = new List<string>();
        deps.UnitOfWork.SaveChangesAsync(Arg.Any<CancellationToken>())
            .Returns(call => { calls.Add("save"); return Task.FromResult(1); });
        deps.RefreshTokens.RevokeAllForUserAsync(Arg.Any<UserId>(), Arg.Any<CancellationToken>())
            .Returns(call => { calls.Add("revoke"); return Task.CompletedTask; });

        await DeleteAccountCommandHandler.Handle(
            new DeleteAccountCommand(user.Id),
            deps.Users, deps.DeletionLogs, deps.UnitOfWork,
            deps.RefreshTokens, deps.Publisher, deps.Clock,
            CancellationToken.None);

        calls.ShouldBe(["save", "revoke"]);
    }
}
