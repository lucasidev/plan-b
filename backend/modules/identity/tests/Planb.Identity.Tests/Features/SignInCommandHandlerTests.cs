using NSubstitute;
using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Identity.Application.Features.SignIn;
using Planb.Identity.Domain.Users;
using Planb.Identity.Domain.Users.Events;
using Planb.Identity.Tests.Users;
using Planb.SharedKernel.Abstractions.DomainEvents;
using Planb.SharedKernel.Primitives;
using Shouldly;
using Xunit;

namespace Planb.Identity.Tests.Features;

/// <summary>
/// Handler unit tests para <see cref="SignInCommandHandler"/>. Cubre el branch anti-enumeración
/// (email sintácticamente inválido → <see cref="UserErrors.InvalidCredentials"/>, no un 400 de
/// validación) y los caminos que fijan el resto del comportamiento: user inexistente, password
/// incorrecta, email sin verificar, y el happy path (tokens emitidos, refresh token persistido,
/// domain event despachado).
/// </summary>
public class SignInCommandHandlerTests
{
    private static readonly DateTimeOffset T0 = new(2026, 7, 13, 12, 0, 0, TimeSpan.Zero);

    private static EmailAddress Email(string raw = "lucas@unsta.edu.ar") =>
        EmailAddress.Create(raw).Value;

    private static User VerifiedActiveUser(FixedClock clock)
    {
        var user = User.Register(Email(), "hashed", clock).Value;
        user.IssueVerificationToken(
            TokenPurpose.UserEmailVerification, "raw", TimeSpan.FromHours(24), clock);
        user.VerifyEmail("raw", clock);
        user.ClearDomainEvents();
        return user;
    }

    private sealed record Deps(
        IUserRepository Users,
        IPasswordHasher Passwords,
        IJwtIssuer Jwt,
        IRefreshTokenStore RefreshTokens,
        IDomainEventPublisher Publisher,
        FixedClock Clock);

    private static Deps NewDeps() => new(
        Substitute.For<IUserRepository>(),
        Substitute.For<IPasswordHasher>(),
        Substitute.For<IJwtIssuer>(),
        Substitute.For<IRefreshTokenStore>(),
        Substitute.For<IDomainEventPublisher>(),
        new FixedClock(T0));

    private static Task<Result<SignInResponse>> Invoke(Deps deps, SignInCommand command) =>
        SignInCommandHandler.Handle(
            command,
            deps.Users,
            deps.Passwords,
            deps.Jwt,
            deps.RefreshTokens,
            deps.Publisher,
            deps.Clock,
            CancellationToken.None);

    [Fact]
    public async Task Handle_returns_InvalidCredentials_when_email_is_syntactically_invalid()
    {
        // Anti-enumeration: un email malformado no debe devolver un error de validación (400)
        // que revele que el formato en sí fue el problema; se trata igual que una password
        // incorrecta o un usuario inexistente.
        var deps = NewDeps();

        var result = await Invoke(deps, new SignInCommand("not-an-email", "whatever12345"));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.InvalidCredentials);
        await deps.Users.DidNotReceive().FindByEmailAsync(
            Arg.Any<EmailAddress>(), Arg.Any<CancellationToken>());
        deps.Jwt.DidNotReceive().IssueTokens(Arg.Any<User>());
    }

    [Fact]
    public async Task Handle_returns_InvalidCredentials_when_user_does_not_exist()
    {
        var deps = NewDeps();
        deps.Users.FindByEmailAsync(Arg.Any<EmailAddress>(), Arg.Any<CancellationToken>())
            .Returns((User?)null);

        var result = await Invoke(deps, new SignInCommand("ghost@unsta.edu.ar", "whatever12345"));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.InvalidCredentials);
        deps.Jwt.DidNotReceive().IssueTokens(Arg.Any<User>());
    }

    [Fact]
    public async Task Handle_returns_InvalidCredentials_when_password_is_wrong()
    {
        var deps = NewDeps();
        var user = VerifiedActiveUser(deps.Clock);
        deps.Users.FindByEmailAsync(Arg.Any<EmailAddress>(), Arg.Any<CancellationToken>())
            .Returns(user);
        deps.Passwords.Verify(Arg.Any<string>(), Arg.Any<string>()).Returns(false);

        var result = await Invoke(deps, new SignInCommand(user.Email.Value, "wrong-password"));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.InvalidCredentials);
        deps.Jwt.DidNotReceive().IssueTokens(Arg.Any<User>());
    }

    [Fact]
    public async Task Handle_returns_EmailNotVerified_when_password_correct_but_email_unverified()
    {
        var deps = NewDeps();
        var user = User.Register(Email(), "hashed", deps.Clock).Value;
        user.ClearDomainEvents();
        deps.Users.FindByEmailAsync(Arg.Any<EmailAddress>(), Arg.Any<CancellationToken>())
            .Returns(user);
        deps.Passwords.Verify(Arg.Any<string>(), Arg.Any<string>()).Returns(true);

        var result = await Invoke(deps, new SignInCommand(user.Email.Value, "correct-password"));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.EmailNotVerified);
        deps.Jwt.DidNotReceive().IssueTokens(Arg.Any<User>());
    }

    [Fact]
    public async Task Handle_happy_path_issues_tokens_stores_refresh_token_and_dispatches_event()
    {
        var deps = NewDeps();
        var user = VerifiedActiveUser(deps.Clock);
        deps.Users.FindByEmailAsync(Arg.Any<EmailAddress>(), Arg.Any<CancellationToken>())
            .Returns(user);
        deps.Passwords.Verify(Arg.Any<string>(), Arg.Any<string>()).Returns(true);
        var tokens = new AuthTokens("access-token", T0.AddMinutes(15), "refresh-token", T0.AddDays(30));
        deps.Jwt.IssueTokens(user).Returns(tokens);

        var result = await Invoke(deps, new SignInCommand(user.Email.Value, "correct-password"));

        result.IsSuccess.ShouldBeTrue();
        result.Value.UserId.ShouldBe(user.Id.Value);
        result.Value.Email.ShouldBe(user.Email.Value);
        result.Value.Role.ShouldBe(user.Role.ToString());
        result.Value.Tokens.ShouldBe(tokens);

        await deps.RefreshTokens.Received(1).StoreAsync(
            tokens.RefreshToken, user.Id, tokens.RefreshTokenExpiresAt, Arg.Any<CancellationToken>());
        await deps.Publisher.Received(1).PublishAsync(
            Arg.Is<UserSignedInDomainEvent>(e => e!.UserId == user.Id),
            Arg.Any<CancellationToken>());
    }
}
