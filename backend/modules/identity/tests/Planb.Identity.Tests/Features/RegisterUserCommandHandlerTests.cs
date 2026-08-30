using NSubstitute;
using Planb.Academic.Application.Contracts;
using Planb.Identity.Application.Abstractions.Email;
using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Identity.Application.Features.RegisterUser;
using Planb.Identity.Domain.Users;
using Planb.Identity.Tests.Users;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Abstractions.DomainEvents;
using Planb.SharedKernel.Primitives;
using Shouldly;
using Xunit;

namespace Planb.Identity.Tests.Features;

/// <summary>
/// Handler unit tests para RegisterUserCommandHandler, centrados en la mudanza de la declaración
/// de carrera al registro:
///   - El CareerPlanId se resuelve contra Academic ANTES que nada más.
///   - Un plan inválido no llega a mirar si el mail existe (anti-enumeración, ADR-0076).
///   - Un registro con plan válido queda con la carrera declarada en el aggregate.
///   - La rama de mail existente no toca la declaración de carrera (no crea ni persiste un user).
///
/// El resto del flow (hash antes del exists, token de verificación, envío de mail) ya estaba
/// cubierto solo indirectamente vía integration tests; estos casos son los que la mudanza agrega.
/// </summary>
public class RegisterUserCommandHandlerTests
{
    private static readonly DateTimeOffset T0 = new(2026, 5, 1, 12, 0, 0, TimeSpan.Zero);

    private sealed record Deps(
        IUserRepository Users,
        IIdentityUnitOfWork UnitOfWork,
        IAcademicQueryService Academic,
        IPasswordHasher Passwords,
        ITokenGenerator TokenGenerator,
        IVerificationEmailSender EmailSender,
        IDomainEventPublisher Publisher,
        FixedClock Clock);

    private static Deps NewDeps()
    {
        var passwords = Substitute.For<IPasswordHasher>();
        passwords.Hash(Arg.Any<string>()).Returns("hashed-password");
        var generator = Substitute.For<ITokenGenerator>();
        generator.Generate(Arg.Any<int>()).Returns("generated-token");

        return new Deps(
            Substitute.For<IUserRepository>(),
            Substitute.For<IIdentityUnitOfWork>(),
            Substitute.For<IAcademicQueryService>(),
            passwords,
            generator,
            Substitute.For<IVerificationEmailSender>(),
            Substitute.For<IDomainEventPublisher>(),
            new FixedClock(T0));
    }

    private static Task<Result<RegisterUserResponse>> InvokeAsync(
        Deps deps, RegisterUserCommand command) =>
        RegisterUserCommandHandler.Handle(
            command,
            deps.Users,
            deps.UnitOfWork,
            deps.Academic,
            deps.Passwords,
            deps.TokenGenerator,
            deps.EmailSender,
            deps.Publisher,
            deps.Clock,
            CancellationToken.None);

    [Fact]
    public async Task Handle_returns_registration_career_plan_not_found_when_plan_does_not_exist()
    {
        var deps = NewDeps();
        deps.Academic.GetCareerPlanByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns((CareerPlanSummary?)null);

        var result = await InvokeAsync(
            deps, new RegisterUserCommand("lucas@unsta.edu.ar", "valid-password-12c", Guid.NewGuid()));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.RegistrationCareerPlanNotFound);
    }

    /// <summary>
    /// El test anti-enumeración: sin esto, la regresión de mover la validación del plan después
    /// del exists es invisible (todos los demás tests seguirían en verde). Si el plan se validara
    /// después del exists, un plan inválido daría 400 con mail libre y 202 con mail ocupado, y el
    /// status code delataría si esa casilla tiene cuenta (misma clase de fuga que cerró ADR-0076).
    /// </summary>
    [Fact]
    public async Task Handle_does_not_probe_the_mailbox_when_the_plan_is_invalid()
    {
        var deps = NewDeps();
        deps.Academic.GetCareerPlanByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns((CareerPlanSummary?)null);

        await InvokeAsync(
            deps, new RegisterUserCommand("lucas@unsta.edu.ar", "valid-password-12c", Guid.NewGuid()));

        await deps.Users.DidNotReceive().ExistsByEmailAsync(
            Arg.Any<EmailAddress>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_declares_the_career_on_the_new_user()
    {
        var deps = NewDeps();
        var planId = Guid.NewGuid();
        var careerId = Guid.NewGuid();
        deps.Academic.GetCareerPlanByIdAsync(planId, Arg.Any<CancellationToken>())
            .Returns(new CareerPlanSummary(planId, careerId, Guid.NewGuid(), 2024));
        deps.Users.ExistsByEmailAsync(Arg.Any<EmailAddress>(), Arg.Any<CancellationToken>())
            .Returns(false);
        User? addedUser = null;
        deps.Users.When(x => x.Add(Arg.Any<User>())).Do(ci => addedUser = ci.Arg<User>());

        var result = await InvokeAsync(
            deps, new RegisterUserCommand("nueva@unsta.edu.ar", "valid-password-12c", planId));

        result.IsSuccess.ShouldBeTrue();
        addedUser.ShouldNotBeNull();
        addedUser!.PendingCareerPlanId.ShouldBe(planId);
        addedUser.PendingCareerId.ShouldBe(careerId);
        await deps.UnitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_does_not_declare_anything_when_the_email_already_exists()
    {
        var deps = NewDeps();
        var planId = Guid.NewGuid();
        deps.Academic.GetCareerPlanByIdAsync(planId, Arg.Any<CancellationToken>())
            .Returns(new CareerPlanSummary(planId, Guid.NewGuid(), Guid.NewGuid(), 2024));
        deps.Users.ExistsByEmailAsync(Arg.Any<EmailAddress>(), Arg.Any<CancellationToken>())
            .Returns(true);

        var result = await InvokeAsync(
            deps, new RegisterUserCommand("ya-existe@unsta.edu.ar", "valid-password-12c", planId));

        result.IsSuccess.ShouldBeTrue();
        deps.Users.DidNotReceive().Add(Arg.Any<User>());
        await deps.EmailSender.Received(1).SendExistingAccountNoticeAsync(
            Arg.Any<EmailAddress>(), Arg.Any<CancellationToken>());
        await deps.UnitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
