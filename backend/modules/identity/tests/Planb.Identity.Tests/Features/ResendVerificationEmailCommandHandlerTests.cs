using NSubstitute;
using Planb.Identity.Application.Abstractions.Email;
using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Identity.Application.Features.ResendVerificationEmail;
using Planb.Identity.Domain.Users;
using Planb.Identity.Tests.Users;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Abstractions.DomainEvents;
using Shouldly;
using Xunit;

namespace Planb.Identity.Tests.Features;

/// <summary>
/// Handler unit tests para ResendVerificationEmailCommandHandler. Cubre las 4 ramas
/// del flow anti-enumeración (US-021 AC):
///   - email malformado → silent success, no mail
///   - usuario no existe → silent success, no mail
///   - usuario existe pero ya verificado → silent success, no mail
///   - usuario existe pero disabled → silent success, no mail
///   - usuario válido (registrado, no verificado, activo) → success + mail enviado +
///     token nuevo issued con purpose=UserEmailVerification + UoW saved.
///
/// Las dependencias externas (repo, UoW, generator, sender, publisher, clock) están
/// mockeadas con NSubstitute. El handler es lógica pura sobre puertos.
/// </summary>
public class ResendVerificationEmailCommandHandlerTests
{
    private static readonly DateTimeOffset T0 = new(2026, 5, 1, 12, 0, 0, TimeSpan.Zero);

    private static EmailAddress Email(string raw = "lucia@unsta.edu.ar") =>
        EmailAddress.Create(raw).Value;

    private static User UnverifiedActiveUser(FixedClock clock)
    {
        // Estado típico post-Register: emit token original de 24h, no verifica.
        var user = User.Register(Email(), "hashed", clock).Value;
        user.IssueVerificationToken(
            TokenPurpose.UserEmailVerification, "original-token", TimeSpan.FromHours(24), clock);
        user.ClearDomainEvents();
        return user;
    }

    private static User VerifiedActiveUser(FixedClock clock)
    {
        var user = UnverifiedActiveUser(clock);
        user.VerifyEmail("original-token", clock);
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
        generator.Generate(Arg.Any<int>()).Returns("regenerated-token");
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

        var result = await ResendVerificationEmailCommandHandler.Handle(
            new ResendVerificationEmailCommand("not-an-email"),
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
        await deps.EmailSender.DidNotReceive().SendAsync(
            Arg.Any<EmailAddress>(), Arg.Any<string>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_returns_success_and_does_not_send_mail_when_user_not_found()
    {
        var deps = NewDeps();
        deps.Users.FindByEmailAsync(Arg.Any<EmailAddress>(), Arg.Any<CancellationToken>())
            .Returns((User?)null);

        var result = await ResendVerificationEmailCommandHandler.Handle(
            new ResendVerificationEmailCommand("ghost@nope.com"),
            deps.Users,
            deps.UnitOfWork,
            deps.TokenGenerator,
            deps.EmailSender,
            deps.Publisher,
            deps.Clock,
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        await deps.EmailSender.DidNotReceive().SendAsync(
            Arg.Any<EmailAddress>(), Arg.Any<string>(), Arg.Any<CancellationToken>());
        await deps.UnitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_returns_success_and_does_not_send_mail_when_user_already_verified()
    {
        var deps = NewDeps();
        var verified = VerifiedActiveUser(deps.Clock);
        deps.Users.FindByEmailAsync(Arg.Any<EmailAddress>(), Arg.Any<CancellationToken>())
            .Returns(verified);

        var result = await ResendVerificationEmailCommandHandler.Handle(
            new ResendVerificationEmailCommand(verified.Email.Value),
            deps.Users,
            deps.UnitOfWork,
            deps.TokenGenerator,
            deps.EmailSender,
            deps.Publisher,
            deps.Clock,
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        await deps.EmailSender.DidNotReceive().SendAsync(
            Arg.Any<EmailAddress>(), Arg.Any<string>(), Arg.Any<CancellationToken>());
        await deps.UnitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_returns_success_and_does_not_send_mail_when_user_disabled()
    {
        var deps = NewDeps();
        var disabled = UnverifiedActiveUser(deps.Clock);
        disabled.Disable(Guid.NewGuid(), "abuse", deps.Clock);
        deps.Users.FindByEmailAsync(Arg.Any<EmailAddress>(), Arg.Any<CancellationToken>())
            .Returns(disabled);

        var result = await ResendVerificationEmailCommandHandler.Handle(
            new ResendVerificationEmailCommand(disabled.Email.Value),
            deps.Users,
            deps.UnitOfWork,
            deps.TokenGenerator,
            deps.EmailSender,
            deps.Publisher,
            deps.Clock,
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        await deps.EmailSender.DidNotReceive().SendAsync(
            Arg.Any<EmailAddress>(), Arg.Any<string>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_issues_new_token_invalidates_previous_saves_and_sends_mail_for_unverified_user()
    {
        var deps = NewDeps();
        var user = UnverifiedActiveUser(deps.Clock);
        deps.Users.FindByEmailAsync(Arg.Any<EmailAddress>(), Arg.Any<CancellationToken>())
            .Returns(user);

        var result = await ResendVerificationEmailCommandHandler.Handle(
            new ResendVerificationEmailCommand(user.Email.Value),
            deps.Users,
            deps.UnitOfWork,
            deps.TokenGenerator,
            deps.EmailSender,
            deps.Publisher,
            deps.Clock,
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();

        // El aggregate ahora tiene 2 tokens de email-verification: el original (invalidado)
        // y el nuevo (active).
        var emailTokens = user.Tokens
            .Where(t => t.Purpose == TokenPurpose.UserEmailVerification)
            .ToList();
        emailTokens.Count.ShouldBe(2);
        emailTokens.Single(t => t.Token == "original-token").IsActive.ShouldBeFalse();
        var newToken = emailTokens.Single(t => t.Token == "regenerated-token");
        newToken.IsActive.ShouldBeTrue();

        // UoW commit + mail enviado con el nuevo raw token via SendAsync (no SendPasswordResetAsync).
        await deps.UnitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
        await deps.EmailSender.Received(1).SendAsync(
            user.Email,
            "regenerated-token",
            Arg.Any<CancellationToken>());
    }
}
