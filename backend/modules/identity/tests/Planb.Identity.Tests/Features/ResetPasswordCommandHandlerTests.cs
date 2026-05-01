using NSubstitute;
using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Identity.Application.Features.ResetPassword;
using Planb.Identity.Domain.Users;
using Planb.Identity.Tests.Users;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Abstractions.DomainEvents;
using Shouldly;
using Xunit;

namespace Planb.Identity.Tests.Features;

/// <summary>
/// Handler unit tests para ResetPasswordCommandHandler. Cubre:
///   - Token no existe en ningún usuario → VerificationTokenInvalid
///   - User.ResetPassword falla (token wrong purpose, expired, etc.) → propaga el error
///   - Happy path: User.ResetPassword OK → SaveChangesAsync + RevokeAllForUserAsync
///
/// El detalle de los failure modes del aggregate (token consumed, expired, wrong purpose,
/// account disabled, password too weak) está cubierto en UserTests.ResetPassword_*. Este
/// test se concentra en el wiring del handler: que llame al aggregate con los args correctos
/// y que el revoke ocurra DESPUÉS de SaveChangesAsync (no antes, para no matar sesiones de un
/// write rolled back).
/// </summary>
public class ResetPasswordCommandHandlerTests
{
    private static readonly DateTimeOffset T0 = new(2026, 4, 24, 12, 0, 0, TimeSpan.Zero);

    private static EmailAddress Email(string raw = "lucia@unsta.edu.ar") =>
        EmailAddress.Create(raw).Value;

    private static User VerifiedActiveUserWithResetToken(FixedClock clock, string token = "raw-reset")
    {
        var user = User.Register(Email(), "old-hash", clock).Value;
        user.IssueVerificationToken(
            TokenPurpose.UserEmailVerification, "verify", TimeSpan.FromHours(24), clock);
        user.VerifyEmail("verify", clock);
        user.IssueVerificationToken(
            TokenPurpose.PasswordReset, token, TimeSpan.FromMinutes(30), clock);
        user.ClearDomainEvents();
        return user;
    }

    private sealed record Deps(
        IUserRepository Users,
        IIdentityUnitOfWork UnitOfWork,
        IPasswordHasher Passwords,
        IRefreshTokenStore RefreshTokens,
        IDomainEventPublisher Publisher,
        FixedClock Clock);

    private static Deps NewDeps()
    {
        var passwords = Substitute.For<IPasswordHasher>();
        passwords.Hash(Arg.Any<string>()).Returns(call => $"hashed:{call.Arg<string>()}");
        return new Deps(
            Substitute.For<IUserRepository>(),
            Substitute.For<IIdentityUnitOfWork>(),
            passwords,
            Substitute.For<IRefreshTokenStore>(),
            Substitute.For<IDomainEventPublisher>(),
            new FixedClock(T0));
    }

    [Fact]
    public async Task Handle_returns_VerificationTokenInvalid_when_no_user_owns_the_token()
    {
        var deps = NewDeps();
        deps.Users.FindByRawVerificationTokenAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns((User?)null);

        var result = await ResetPasswordCommandHandler.Handle(
            new ResetPasswordCommand("ghost-token", new string('x', User.MinPasswordLength)),
            deps.Users,
            deps.UnitOfWork,
            deps.Passwords,
            deps.RefreshTokens,
            deps.Publisher,
            deps.Clock,
            CancellationToken.None);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.VerificationTokenInvalid);
        await deps.UnitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
        await deps.RefreshTokens.DidNotReceive().RevokeAllForUserAsync(
            Arg.Any<UserId>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_propagates_aggregate_error_when_password_too_weak_and_does_not_revoke()
    {
        var deps = NewDeps();
        var user = VerifiedActiveUserWithResetToken(deps.Clock);
        deps.Users.FindByRawVerificationTokenAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(user);

        var result = await ResetPasswordCommandHandler.Handle(
            new ResetPasswordCommand("raw-reset", "short"),
            deps.Users,
            deps.UnitOfWork,
            deps.Passwords,
            deps.RefreshTokens,
            deps.Publisher,
            deps.Clock,
            CancellationToken.None);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.PasswordTooWeak);
        // No SaveChanges: el aggregate no se modificó (token no consumido tampoco).
        await deps.UnitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
        // No RevokeAll: si hay error, no matamos sesiones (el password no cambió).
        await deps.RefreshTokens.DidNotReceive().RevokeAllForUserAsync(
            Arg.Any<UserId>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_propagates_aggregate_error_when_token_wrong_purpose()
    {
        var deps = NewDeps();
        var user = User.Register(Email(), "hashed", deps.Clock).Value;
        user.IssueVerificationToken(
            TokenPurpose.UserEmailVerification, "verify-token", TimeSpan.FromHours(24), deps.Clock);
        deps.Users.FindByRawVerificationTokenAsync("verify-token", Arg.Any<CancellationToken>())
            .Returns(user);

        var result = await ResetPasswordCommandHandler.Handle(
            new ResetPasswordCommand("verify-token", new string('x', User.MinPasswordLength)),
            deps.Users,
            deps.UnitOfWork,
            deps.Passwords,
            deps.RefreshTokens,
            deps.Publisher,
            deps.Clock,
            CancellationToken.None);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.VerificationWrongPurpose);
    }

    [Fact]
    public async Task Handle_persists_then_revokes_all_refresh_tokens_on_success()
    {
        var deps = NewDeps();
        var user = VerifiedActiveUserWithResetToken(deps.Clock);
        deps.Users.FindByRawVerificationTokenAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(user);

        var newPassword = new string('x', User.MinPasswordLength);
        var result = await ResetPasswordCommandHandler.Handle(
            new ResetPasswordCommand("raw-reset", newPassword),
            deps.Users,
            deps.UnitOfWork,
            deps.Passwords,
            deps.RefreshTokens,
            deps.Publisher,
            deps.Clock,
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        // El handler hashea via IPasswordHasher.Hash y persiste el hash devuelto.
        user.PasswordHash.ShouldBe($"hashed:{newPassword}");
        // SaveChanges + RevokeAll en orden estricto (revoke después de persist).
        Received.InOrder(() =>
        {
            deps.UnitOfWork.SaveChangesAsync(Arg.Any<CancellationToken>());
            deps.RefreshTokens.RevokeAllForUserAsync(user.Id, Arg.Any<CancellationToken>());
        });
    }
}
