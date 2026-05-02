using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Application.Abstractions.Reading;
using Planb.Identity.Application.Features.ExpireUnverifiedRegistrations;
using Planb.Identity.Domain.Users;
using Planb.Identity.Tests.Users;
using Planb.SharedKernel.Abstractions.DomainEvents;
using Shouldly;
using Xunit;

namespace Planb.Identity.Tests.Features;

/// <summary>
/// Handler unit tests para ExpireUnverifiedRegistrationsCommandHandler (US-022). Cubre las
/// 4 ramas:
///   - 0 candidatos → success silente, no UoW commit.
///   - N candidatos válidos → success, todos expirados, 1 commit.
///   - candidato que volvió elegible (ej. user verificó entre SELECT y carga) → skipped, sigue
///     con el resto.
///   - candidato que desapareció (FindByIdAsync devuelve null) → skipped, sigue con el resto.
///
/// Las dependencias están mockeadas con NSubstitute. El handler es lógica de orquestación pura.
/// </summary>
public class ExpireUnverifiedRegistrationsCommandHandlerTests
{
    private static readonly DateTimeOffset T0 = new(2026, 5, 1, 12, 0, 0, TimeSpan.Zero);

    private static EmailAddress Email(string raw) => EmailAddress.Create(raw).Value;

    private static User UnverifiedUser(FixedClock clock, string emailRaw)
    {
        var user = User.Register(Email(emailRaw), "hashed", clock).Value;
        user.IssueVerificationToken(
            TokenPurpose.UserEmailVerification, "tok", TimeSpan.FromHours(24), clock);
        user.ClearDomainEvents();
        return user;
    }

    private sealed record Deps(
        IUserRepository Users,
        IIdentityReadService Reads,
        IIdentityUnitOfWork UnitOfWork,
        IDomainEventPublisher Publisher,
        FixedClock Clock);

    private static Deps NewDeps() => new(
        Substitute.For<IUserRepository>(),
        Substitute.For<IIdentityReadService>(),
        Substitute.For<IIdentityUnitOfWork>(),
        Substitute.For<IDomainEventPublisher>(),
        new FixedClock(T0));

    [Fact]
    public async Task Handle_returns_success_and_does_nothing_when_no_candidates()
    {
        var deps = NewDeps();
        deps.Reads.GetUnverifiedExpirationCandidatesAsync(Arg.Any<DateTimeOffset>(), Arg.Any<CancellationToken>())
            .Returns(Array.Empty<UserId>());

        var result = await ExpireUnverifiedRegistrationsCommandHandler.Handle(
            new ExpireUnverifiedRegistrationsCommand(),
            deps.Users,
            deps.Reads,
            deps.UnitOfWork,
            deps.Publisher,
            deps.Clock,
            NullLogger<ExpireUnverifiedRegistrationsCommandLogger>.Instance,
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        await deps.UnitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_expires_all_candidates_and_commits_once()
    {
        var deps = NewDeps();
        var user1 = UnverifiedUser(deps.Clock, "lucia@unsta.edu.ar");
        var user2 = UnverifiedUser(deps.Clock, "mateo@unsta.edu.ar");

        deps.Clock.Advance(TimeSpan.FromDays(8));

        deps.Reads.GetUnverifiedExpirationCandidatesAsync(Arg.Any<DateTimeOffset>(), Arg.Any<CancellationToken>())
            .Returns(new[] { user1.Id, user2.Id });
        deps.Users.FindByIdAsync(user1.Id, Arg.Any<CancellationToken>()).Returns(user1);
        deps.Users.FindByIdAsync(user2.Id, Arg.Any<CancellationToken>()).Returns(user2);

        var result = await ExpireUnverifiedRegistrationsCommandHandler.Handle(
            new ExpireUnverifiedRegistrationsCommand(),
            deps.Users,
            deps.Reads,
            deps.UnitOfWork,
            deps.Publisher,
            deps.Clock,
            NullLogger<ExpireUnverifiedRegistrationsCommandLogger>.Instance,
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        user1.IsExpired.ShouldBeTrue();
        user2.IsExpired.ShouldBeTrue();
        await deps.UnitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_skips_candidate_that_no_longer_qualifies_and_continues()
    {
        var deps = NewDeps();
        var verified = UnverifiedUser(deps.Clock, "lucia@unsta.edu.ar");
        verified.VerifyEmail("tok", deps.Clock); // ya no es candidato
        var stillUnverified = UnverifiedUser(deps.Clock, "mateo@unsta.edu.ar");

        deps.Clock.Advance(TimeSpan.FromDays(8));

        deps.Reads.GetUnverifiedExpirationCandidatesAsync(Arg.Any<DateTimeOffset>(), Arg.Any<CancellationToken>())
            .Returns(new[] { verified.Id, stillUnverified.Id });
        deps.Users.FindByIdAsync(verified.Id, Arg.Any<CancellationToken>()).Returns(verified);
        deps.Users.FindByIdAsync(stillUnverified.Id, Arg.Any<CancellationToken>()).Returns(stillUnverified);

        var result = await ExpireUnverifiedRegistrationsCommandHandler.Handle(
            new ExpireUnverifiedRegistrationsCommand(),
            deps.Users,
            deps.Reads,
            deps.UnitOfWork,
            deps.Publisher,
            deps.Clock,
            NullLogger<ExpireUnverifiedRegistrationsCommandLogger>.Instance,
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        verified.IsExpired.ShouldBeFalse();
        stillUnverified.IsExpired.ShouldBeTrue();
        // Sólo el válido cuenta para el commit.
        await deps.UnitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_skips_candidate_that_repo_returns_null_for()
    {
        var deps = NewDeps();
        var ghostId = new UserId(Guid.NewGuid());
        var realUser = UnverifiedUser(deps.Clock, "lucia@unsta.edu.ar");

        deps.Clock.Advance(TimeSpan.FromDays(8));

        deps.Reads.GetUnverifiedExpirationCandidatesAsync(Arg.Any<DateTimeOffset>(), Arg.Any<CancellationToken>())
            .Returns(new[] { ghostId, realUser.Id });
        deps.Users.FindByIdAsync(ghostId, Arg.Any<CancellationToken>()).Returns((User?)null);
        deps.Users.FindByIdAsync(realUser.Id, Arg.Any<CancellationToken>()).Returns(realUser);

        var result = await ExpireUnverifiedRegistrationsCommandHandler.Handle(
            new ExpireUnverifiedRegistrationsCommand(),
            deps.Users,
            deps.Reads,
            deps.UnitOfWork,
            deps.Publisher,
            deps.Clock,
            NullLogger<ExpireUnverifiedRegistrationsCommandLogger>.Instance,
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        realUser.IsExpired.ShouldBeTrue();
        await deps.UnitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
