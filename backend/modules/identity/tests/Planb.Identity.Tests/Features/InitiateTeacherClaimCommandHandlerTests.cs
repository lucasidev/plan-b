using NSubstitute;
using Planb.Academic.Application.Contracts;
using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Application.Features.InitiateTeacherClaim;
using Planb.Identity.Domain.TeacherProfiles;
using Planb.Identity.Domain.Users;
using Planb.Identity.Tests.Users;
using Planb.SharedKernel.Abstractions.DomainEvents;
using Planb.SharedKernel.Primitives;
using Shouldly;
using Xunit;

namespace Planb.Identity.Tests.Features;

/// <summary>
/// Handler unit tests de InitiateTeacherClaimCommandHandler (US-030). Cubre las ramas:
///   - User no existe (NotFoundById, no se llega a consultar Academic).
///   - User sin verificar / disabled: rechazo (ADR-0008, solo members activos reclaman).
///   - Docente inexistente / soft-deleted: TeacherNotFound / TeacherRemoved.
///   - Claim duplicado del mismo user al mismo docente: AlreadyClaimed (no persiste).
///   - Happy path: profile pending creado, Add + SaveChanges, response IsVerified=false.
///
/// Todas las deps mockeadas (NSubstitute): el test cubre solo la orquestación del handler. La rama
/// "User no-Member" no se testea acá porque el aggregate solo expone Register (→ Member); ese
/// invariante queda cubierto en integration cuando exista una cuenta staff seedeada.
/// </summary>
public class InitiateTeacherClaimCommandHandlerTests
{
    private static readonly DateTimeOffset T0 = new(2026, 6, 27, 12, 0, 0, TimeSpan.Zero);

    private static EmailAddress Email(string raw = "docente@unsta.edu.ar") =>
        EmailAddress.Create(raw).Value;

    private static User VerifiedActiveUser(FixedClock clock)
    {
        var user = User.Register(Email(), "hashed", clock).Value;
        user.IssueVerificationToken(
            TokenPurpose.UserEmailVerification, "tok", TimeSpan.FromHours(24), clock);
        user.VerifyEmail("tok", clock);
        user.ClearDomainEvents();
        return user;
    }

    private static TeacherDetailItem Teacher(Guid id, bool isActive) =>
        new(id, Guid.NewGuid(), "carlos", "brandt", "Profesor Titular", null, null, isActive);

    private sealed record Deps(
        IUserRepository Users,
        ITeacherProfileRepository Profiles,
        IIdentityUnitOfWork UnitOfWork,
        IAcademicQueryService Academic,
        IDomainEventPublisher Publisher,
        FixedClock Clock);

    private static Deps NewDeps() => new(
        Substitute.For<IUserRepository>(),
        Substitute.For<ITeacherProfileRepository>(),
        Substitute.For<IIdentityUnitOfWork>(),
        Substitute.For<IAcademicQueryService>(),
        Substitute.For<IDomainEventPublisher>(),
        new FixedClock(T0));

    private static Task<Result<InitiateTeacherClaimResponse>> Invoke(
        Deps deps, UserId userId, Guid teacherId) =>
        InitiateTeacherClaimCommandHandler.Handle(
            new InitiateTeacherClaimCommand(userId, teacherId),
            deps.Users, deps.Profiles, deps.UnitOfWork, deps.Academic, deps.Publisher, deps.Clock,
            CancellationToken.None);

    [Fact]
    public async Task Handle_returns_user_not_found_when_user_does_not_exist()
    {
        var deps = NewDeps();
        deps.Users.FindByIdAsync(Arg.Any<UserId>(), Arg.Any<CancellationToken>())
            .Returns((User?)null);

        var result = await Invoke(deps, UserId.New(), Guid.NewGuid());

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.NotFoundById);
        await deps.Academic.DidNotReceive()
            .GetTeacherByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_rejects_unverified_user()
    {
        var deps = NewDeps();
        var user = User.Register(Email(), "hashed", deps.Clock).Value;
        user.ClearDomainEvents();
        deps.Users.FindByIdAsync(Arg.Any<UserId>(), Arg.Any<CancellationToken>()).Returns(user);

        var result = await Invoke(deps, user.Id, Guid.NewGuid());

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.EmailNotVerified);
        await deps.UnitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_rejects_disabled_user()
    {
        var deps = NewDeps();
        var user = VerifiedActiveUser(deps.Clock);
        user.Disable(Guid.NewGuid(), "spam", deps.Clock);
        user.ClearDomainEvents();
        deps.Users.FindByIdAsync(Arg.Any<UserId>(), Arg.Any<CancellationToken>()).Returns(user);

        var result = await Invoke(deps, user.Id, Guid.NewGuid());

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.AccountDisabled);
    }

    [Fact]
    public async Task Handle_returns_teacher_not_found_when_academic_has_no_such_teacher()
    {
        var deps = NewDeps();
        var user = VerifiedActiveUser(deps.Clock);
        deps.Users.FindByIdAsync(Arg.Any<UserId>(), Arg.Any<CancellationToken>()).Returns(user);
        deps.Academic.GetTeacherByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns((TeacherDetailItem?)null);

        var result = await Invoke(deps, user.Id, Guid.NewGuid());

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(TeacherProfileErrors.TeacherNotFound);
    }

    [Fact]
    public async Task Handle_returns_teacher_removed_when_teacher_is_soft_deleted()
    {
        var deps = NewDeps();
        var user = VerifiedActiveUser(deps.Clock);
        var teacherId = Guid.NewGuid();
        deps.Users.FindByIdAsync(Arg.Any<UserId>(), Arg.Any<CancellationToken>()).Returns(user);
        deps.Academic.GetTeacherByIdAsync(teacherId, Arg.Any<CancellationToken>())
            .Returns(Teacher(teacherId, isActive: false));

        var result = await Invoke(deps, user.Id, teacherId);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(TeacherProfileErrors.TeacherRemoved);
    }

    [Fact]
    public async Task Handle_returns_already_claimed_when_user_already_claimed_this_teacher()
    {
        var deps = NewDeps();
        var user = VerifiedActiveUser(deps.Clock);
        var teacherId = Guid.NewGuid();
        deps.Users.FindByIdAsync(Arg.Any<UserId>(), Arg.Any<CancellationToken>()).Returns(user);
        deps.Academic.GetTeacherByIdAsync(teacherId, Arg.Any<CancellationToken>())
            .Returns(Teacher(teacherId, isActive: true));
        deps.Profiles.ExistsForUserAndTeacherAsync(user.Id, teacherId, Arg.Any<CancellationToken>())
            .Returns(true);

        var result = await Invoke(deps, user.Id, teacherId);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(TeacherProfileErrors.AlreadyClaimed);
        deps.Profiles.DidNotReceive().Add(Arg.Any<TeacherProfile>());
        await deps.UnitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_creates_pending_claim_persists_and_returns_response_for_happy_path()
    {
        var deps = NewDeps();
        var user = VerifiedActiveUser(deps.Clock);
        var teacherId = Guid.NewGuid();
        deps.Users.FindByIdAsync(Arg.Any<UserId>(), Arg.Any<CancellationToken>()).Returns(user);
        deps.Academic.GetTeacherByIdAsync(teacherId, Arg.Any<CancellationToken>())
            .Returns(Teacher(teacherId, isActive: true));
        deps.Profiles.ExistsForUserAndTeacherAsync(user.Id, teacherId, Arg.Any<CancellationToken>())
            .Returns(false);

        var result = await Invoke(deps, user.Id, teacherId);

        result.IsSuccess.ShouldBeTrue();
        result.Value.TeacherId.ShouldBe(teacherId);
        result.Value.IsVerified.ShouldBeFalse();
        result.Value.ClaimId.ShouldNotBe(Guid.Empty);

        deps.Profiles.Received(1).Add(Arg.Is<TeacherProfile>(p =>
            p.UserId == user.Id && p.TeacherId == teacherId && !p.IsVerified));
        await deps.UnitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
