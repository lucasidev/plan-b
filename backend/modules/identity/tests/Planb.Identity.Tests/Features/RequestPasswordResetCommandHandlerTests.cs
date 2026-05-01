using NSubstitute;
using Planb.Identity.Application.Abstractions.Email;
using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Identity.Application.Features.RequestPasswordReset;
using Planb.Identity.Domain.Users;
using Planb.Identity.Tests.Users;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Abstractions.DomainEvents;
using Shouldly;
using Xunit;

namespace Planb.Identity.Tests.Features;

/// <summary>
/// Handler unit tests para RequestPasswordResetCommandHandler. Cubre las 4 ramas
/// del flow anti-enumeración (US-033 AC):
///   - email malformado → silent success, no mail
///   - usuario no existe → silent success, no mail
///   - usuario existe pero unverified/disabled → silent success, no mail
///   - usuario válido → success + mail enviado + token issued + UoW saved
///
/// Las dependencias externas (repo, UoW, generator, sender, publisher, clock)
/// están mockeadas con NSubstitute. El handler es lógica pura sobre puertos.
/// </summary>
public class RequestPasswordResetCommandHandlerTests
{
    private static readonly DateTimeOffset T0 = new(2026, 4, 24, 12, 0, 0, TimeSpan.Zero);

    private static EmailAddress Email(string raw = "lucia@unsta.edu.ar") =>
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
        IIdentityUnitOfWork UnitOfWork,
        ITokenGenerator TokenGenerator,
        IVerificationEmailSender EmailSender,
        IDomainEventPublisher Publisher,
        FixedClock Clock);

    private static Deps NewDeps()
    {
        var clock = new FixedClock(T0);
        var generator = Substitute.For<ITokenGenerator>();
        generator.Generate(Arg.Any<int>()).Returns("generated-token");
        return new Deps(
            Substitute.For<IUserRepository>(),
            Substitute.For<IIdentityUnitOfWork>(),
            generator,
            Substitute.For<IVerificationEmailSender>(),
            Substitute.For<IDomainEventPublisher>(),
            clock);
    }

    [Fact]
    public async Task Handle_returns_success_and_does_nothing_when_email_is_malformed()
    {
        var deps = NewDeps();

        var result = await RequestPasswordResetCommandHandler.Handle(
            new RequestPasswordResetCommand("not-an-email"),
            deps.Users,
            deps.UnitOfWork,
            deps.TokenGenerator,
            deps.EmailSender,
            deps.Publisher,
            deps.Clock,
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        await deps.Users.DidNotReceive().FindByEmailAsync(
            Arg.Any<EmailAddress>(), Arg.Any<CancellationToken>());
        await deps.EmailSender.DidNotReceive().SendPasswordResetAsync(
            Arg.Any<EmailAddress>(), Arg.Any<string>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_returns_success_and_does_not_send_mail_when_user_not_found()
    {
        var deps = NewDeps();
        deps.Users.FindByEmailAsync(Arg.Any<EmailAddress>(), Arg.Any<CancellationToken>())
            .Returns((User?)null);

        var result = await RequestPasswordResetCommandHandler.Handle(
            new RequestPasswordResetCommand("ghost@nope.com"),
            deps.Users,
            deps.UnitOfWork,
            deps.TokenGenerator,
            deps.EmailSender,
            deps.Publisher,
            deps.Clock,
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        await deps.EmailSender.DidNotReceive().SendPasswordResetAsync(
            Arg.Any<EmailAddress>(), Arg.Any<string>(), Arg.Any<CancellationToken>());
        await deps.UnitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_returns_success_and_does_not_send_mail_when_user_unverified()
    {
        var deps = NewDeps();
        var unverified = User.Register(Email(), "hashed", deps.Clock).Value;
        deps.Users.FindByEmailAsync(Arg.Any<EmailAddress>(), Arg.Any<CancellationToken>())
            .Returns(unverified);

        var result = await RequestPasswordResetCommandHandler.Handle(
            new RequestPasswordResetCommand(unverified.Email.Value),
            deps.Users,
            deps.UnitOfWork,
            deps.TokenGenerator,
            deps.EmailSender,
            deps.Publisher,
            deps.Clock,
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        await deps.EmailSender.DidNotReceive().SendPasswordResetAsync(
            Arg.Any<EmailAddress>(), Arg.Any<string>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_returns_success_and_does_not_send_mail_when_user_disabled()
    {
        var deps = NewDeps();
        var disabled = VerifiedActiveUser(deps.Clock);
        disabled.Disable(Guid.NewGuid(), "abuse", deps.Clock);
        deps.Users.FindByEmailAsync(Arg.Any<EmailAddress>(), Arg.Any<CancellationToken>())
            .Returns(disabled);

        var result = await RequestPasswordResetCommandHandler.Handle(
            new RequestPasswordResetCommand(disabled.Email.Value),
            deps.Users,
            deps.UnitOfWork,
            deps.TokenGenerator,
            deps.EmailSender,
            deps.Publisher,
            deps.Clock,
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        await deps.EmailSender.DidNotReceive().SendPasswordResetAsync(
            Arg.Any<EmailAddress>(), Arg.Any<string>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_issues_token_saves_and_sends_mail_for_valid_user()
    {
        var deps = NewDeps();
        var user = VerifiedActiveUser(deps.Clock);
        deps.Users.FindByEmailAsync(Arg.Any<EmailAddress>(), Arg.Any<CancellationToken>())
            .Returns(user);

        var result = await RequestPasswordResetCommandHandler.Handle(
            new RequestPasswordResetCommand(user.Email.Value),
            deps.Users,
            deps.UnitOfWork,
            deps.TokenGenerator,
            deps.EmailSender,
            deps.Publisher,
            deps.Clock,
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        // El aggregate recibió un token con purpose=PasswordReset.
        var token = user.Tokens.Single(t => t.Purpose == TokenPurpose.PasswordReset);
        token.Token.ShouldBe("generated-token");
        token.IsActive.ShouldBeTrue();
        // UoW commit + mail enviado con el raw token.
        await deps.UnitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
        await deps.EmailSender.Received(1).SendPasswordResetAsync(
            user.Email,
            "generated-token",
            Arg.Any<CancellationToken>());
    }
}
