using NSubstitute;
using Planb.Academic.Application.Contracts;
using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Application.Features.CreateStudentProfile;
using Planb.Identity.Domain.Users;
using Planb.Identity.Tests.Users;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Abstractions.DomainEvents;
using Shouldly;
using Xunit;

namespace Planb.Identity.Tests.Features;

/// <summary>
/// Handler unit tests para CreateStudentProfileCommandHandler (US-012). Cubre las ramas:
///   - User no existe (NotFound).
///   - CareerPlan no existe (CareerPlanErrors.NotFound).
///   - User no verificado / disabled / no-Member: errores del aggregate forwardeados.
///   - Year fuera de rango / duplicate profile: errores del aggregate forwardeados.
///   - Happy path: profile creado con CareerId derivado del plan, save + dispatch.
///
/// El IAcademicQueryService está mockeado (cross-BC read). El IUserRepository, UoW y publisher
/// también, asi el test cubre solo la orquestación del handler.
/// </summary>
public class CreateStudentProfileCommandHandlerTests
{
    private static readonly DateTimeOffset T0 = new(2026, 5, 1, 12, 0, 0, TimeSpan.Zero);

    private static EmailAddress Email(string raw = "lucia@unsta.edu.ar") =>
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

    private sealed record Deps(
        IUserRepository Users,
        IIdentityUnitOfWork UnitOfWork,
        IAcademicQueryService Academic,
        IDomainEventPublisher Publisher,
        FixedClock Clock);

    private static Deps NewDeps() => new(
        Substitute.For<IUserRepository>(),
        Substitute.For<IIdentityUnitOfWork>(),
        Substitute.For<IAcademicQueryService>(),
        Substitute.For<IDomainEventPublisher>(),
        new FixedClock(T0));

    [Fact]
    public async Task Handle_returns_user_not_found_when_user_does_not_exist()
    {
        var deps = NewDeps();
        deps.Users.FindByIdAsync(Arg.Any<UserId>(), Arg.Any<CancellationToken>())
            .Returns((User?)null);

        var result = await CreateStudentProfileCommandHandler.Handle(
            new CreateStudentProfileCommand(UserId.New(), Guid.NewGuid(), 2024),
            deps.Users,
            deps.UnitOfWork,
            deps.Academic,
            deps.Publisher,
            deps.Clock,
            CancellationToken.None);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.NotFoundById);
        await deps.Academic.DidNotReceive().GetCareerPlanByIdAsync(
            Arg.Any<Guid>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_returns_career_plan_not_found_when_plan_does_not_exist_in_academic()
    {
        var deps = NewDeps();
        var user = VerifiedActiveUser(deps.Clock);
        deps.Users.FindByIdAsync(Arg.Any<UserId>(), Arg.Any<CancellationToken>())
            .Returns(user);
        deps.Academic.GetCareerPlanByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns((CareerPlanSummary?)null);

        var result = await CreateStudentProfileCommandHandler.Handle(
            new CreateStudentProfileCommand(user.Id, Guid.NewGuid(), 2024),
            deps.Users,
            deps.UnitOfWork,
            deps.Academic,
            deps.Publisher,
            deps.Clock,
            CancellationToken.None);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.StudentProfileCareerPlanNotFound);
        await deps.UnitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_forwards_aggregate_failure_when_user_not_verified()
    {
        var deps = NewDeps();
        // User registrado pero sin verificar.
        var user = User.Register(Email(), "hashed", deps.Clock).Value;
        user.ClearDomainEvents();

        deps.Users.FindByIdAsync(Arg.Any<UserId>(), Arg.Any<CancellationToken>())
            .Returns(user);
        deps.Academic.GetCareerPlanByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns(new CareerPlanSummary(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), 2024));

        var result = await CreateStudentProfileCommandHandler.Handle(
            new CreateStudentProfileCommand(user.Id, Guid.NewGuid(), 2024),
            deps.Users,
            deps.UnitOfWork,
            deps.Academic,
            deps.Publisher,
            deps.Clock,
            CancellationToken.None);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.EmailNotVerified);
        await deps.UnitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_forwards_aggregate_failure_when_year_out_of_range()
    {
        var deps = NewDeps();
        var user = VerifiedActiveUser(deps.Clock);
        deps.Users.FindByIdAsync(Arg.Any<UserId>(), Arg.Any<CancellationToken>())
            .Returns(user);
        deps.Academic.GetCareerPlanByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns(new CareerPlanSummary(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), 2024));

        var result = await CreateStudentProfileCommandHandler.Handle(
            new CreateStudentProfileCommand(user.Id, Guid.NewGuid(), 1980),
            deps.Users,
            deps.UnitOfWork,
            deps.Academic,
            deps.Publisher,
            deps.Clock,
            CancellationToken.None);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.EnrollmentYearOutOfRange);
    }

    [Fact]
    public async Task Handle_creates_profile_persists_and_returns_response_for_happy_path()
    {
        var deps = NewDeps();
        var user = VerifiedActiveUser(deps.Clock);
        var careerPlanId = Guid.NewGuid();
        var careerId = Guid.NewGuid();
        var universityId = Guid.NewGuid();

        deps.Users.FindByIdAsync(Arg.Any<UserId>(), Arg.Any<CancellationToken>())
            .Returns(user);
        deps.Academic.GetCareerPlanByIdAsync(careerPlanId, Arg.Any<CancellationToken>())
            .Returns(new CareerPlanSummary(careerPlanId, careerId, universityId, 2024));

        var result = await CreateStudentProfileCommandHandler.Handle(
            new CreateStudentProfileCommand(user.Id, careerPlanId, 2024),
            deps.Users,
            deps.UnitOfWork,
            deps.Academic,
            deps.Publisher,
            deps.Clock,
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        var response = result.Value;
        response.CareerPlanId.ShouldBe(careerPlanId);
        response.EnrollmentYear.ShouldBe(2024);
        response.Status.ShouldBe("Active");

        var profile = user.StudentProfiles.ShouldHaveSingleItem();
        profile.CareerPlanId.ShouldBe(careerPlanId);
        profile.CareerId.ShouldBe(careerId); // denormalizado desde el summary

        await deps.UnitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
