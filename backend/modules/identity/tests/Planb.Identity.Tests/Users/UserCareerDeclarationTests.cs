using Planb.Identity.Domain.Users;
using Shouldly;
using Xunit;

namespace Planb.Identity.Tests.Users;

/// <summary>
/// Cubre la mudanza de la declaración de carrera al registro: <see cref="User.DeclareCareerAtRegistration"/>
/// guarda la intención en un user recién registrado, y <see cref="User.VerifyEmail"/> es quien la
/// materializa en un <see cref="StudentProfile"/> apenas el mail se confirma. También cubre que la
/// declaración pendiente se limpia en las dos transiciones terminales del registro
/// (<see cref="User.Deactivate"/>, <see cref="User.ExpireRegistration"/>).
/// </summary>
public class UserCareerDeclarationTests
{
    private static readonly DateTimeOffset T0 = new(2026, 5, 1, 12, 0, 0, TimeSpan.Zero);

    private static EmailAddress Email(string raw = "nueva@unsta.edu.ar") =>
        EmailAddress.Create(raw).Value;

    /// <summary>
    /// User recién registrado que ya declaró carrera y tiene un token de verificación activo,
    /// listo para que un test dispare <see cref="User.VerifyEmail"/>.
    /// </summary>
    private static (User User, Guid PlanId, Guid CareerId) RegisteredUserWithPendingCareer(
        FixedClock clock, string rawToken = "raw-token")
    {
        var user = User.Register(Email(), "hashed", clock).Value;
        var planId = Guid.NewGuid();
        var careerId = Guid.NewGuid();
        user.DeclareCareerAtRegistration(planId, careerId, clock);
        user.IssueVerificationToken(
            TokenPurpose.UserEmailVerification, rawToken, TimeSpan.FromHours(24), clock);
        user.ClearDomainEvents();
        return (user, planId, careerId);
    }

    // -- DeclareCareerAtRegistration -------------------------------------------------------

    [Fact]
    public void DeclareCareerAtRegistration_stores_the_pending_plan_and_career()
    {
        var clock = new FixedClock(T0);
        var user = User.Register(Email(), "hashed", clock).Value;
        var planId = Guid.NewGuid();
        var careerId = Guid.NewGuid();

        clock.Advance(TimeSpan.FromMinutes(1));
        var result = user.DeclareCareerAtRegistration(planId, careerId, clock);

        result.IsSuccess.ShouldBeTrue();
        user.PendingCareerPlanId.ShouldBe(planId);
        user.PendingCareerId.ShouldBe(careerId);
        user.UpdatedAt.ShouldBe(T0.AddMinutes(1));
    }

    [Theory]
    [InlineData(true, false)]
    [InlineData(false, true)]
    [InlineData(true, true)]
    public void DeclareCareerAtRegistration_rejects_empty_ids(bool planEmpty, bool careerEmpty)
    {
        var clock = new FixedClock(T0);
        var user = User.Register(Email(), "hashed", clock).Value;
        var planId = planEmpty ? Guid.Empty : Guid.NewGuid();
        var careerId = careerEmpty ? Guid.Empty : Guid.NewGuid();

        var result = user.DeclareCareerAtRegistration(planId, careerId, clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.CareerDeclarationInvalid);
        user.PendingCareerPlanId.ShouldBeNull();
        user.PendingCareerId.ShouldBeNull();
    }

    [Fact]
    public void DeclareCareerAtRegistration_rejects_an_already_verified_user()
    {
        var clock = new FixedClock(T0);
        var user = User.Register(Email(), "hashed", clock).Value;
        user.IssueVerificationToken(
            TokenPurpose.UserEmailVerification, "tok", TimeSpan.FromHours(24), clock);
        user.VerifyEmail("tok", clock);

        var result = user.DeclareCareerAtRegistration(Guid.NewGuid(), Guid.NewGuid(), clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.CareerAlreadyDeclared);
    }

    // -- VerifyEmail materializa la declaración ---------------------------------------------

    [Fact]
    public void VerifyEmail_materializes_an_active_student_profile_from_the_pending_declaration()
    {
        var clock = new FixedClock(T0);
        var (user, planId, careerId) = RegisteredUserWithPendingCareer(clock);

        clock.Advance(TimeSpan.FromMinutes(5));
        var result = user.VerifyEmail("raw-token", clock);

        result.IsSuccess.ShouldBeTrue();
        var profile = user.StudentProfiles.ShouldHaveSingleItem();
        profile.CareerPlanId.ShouldBe(planId);
        profile.CareerId.ShouldBe(careerId);
        profile.IsActive.ShouldBeTrue();
    }

    [Fact]
    public void VerifyEmail_materializes_the_profile_without_an_enrollment_year()
    {
        var clock = new FixedClock(T0);
        var (user, _, _) = RegisteredUserWithPendingCareer(clock);

        user.VerifyEmail("raw-token", clock);

        user.StudentProfiles.ShouldHaveSingleItem().EnrollmentYear.ShouldBeNull();
    }

    [Fact]
    public void VerifyEmail_clears_the_pending_declaration_after_materializing()
    {
        var clock = new FixedClock(T0);
        var (user, _, _) = RegisteredUserWithPendingCareer(clock);

        user.VerifyEmail("raw-token", clock);

        user.PendingCareerPlanId.ShouldBeNull();
        user.PendingCareerId.ShouldBeNull();
    }

    [Fact]
    public void VerifyEmail_called_twice_still_materializes_only_one_profile()
    {
        var clock = new FixedClock(T0);
        var (user, _, _) = RegisteredUserWithPendingCareer(clock);

        user.VerifyEmail("raw-token", clock);
        clock.Advance(TimeSpan.FromMinutes(1));
        var second = user.VerifyEmail("raw-token", clock);

        second.IsSuccess.ShouldBeTrue();
        user.StudentProfiles.Count.ShouldBe(1);
    }

    [Fact]
    public void VerifyEmail_without_a_pending_declaration_does_not_create_a_profile()
    {
        var clock = new FixedClock(T0);
        var user = User.Register(Email(), "hashed", clock).Value;
        user.IssueVerificationToken(
            TokenPurpose.UserEmailVerification, "raw-token", TimeSpan.FromHours(24), clock);

        var result = user.VerifyEmail("raw-token", clock);

        result.IsSuccess.ShouldBeTrue();
        user.StudentProfiles.ShouldBeEmpty();
    }

    // -- Limpieza en las transiciones terminales del registro --------------------------------

    [Fact]
    public void Deactivate_clears_the_pending_career_declaration()
    {
        var clock = new FixedClock(T0);
        var user = User.Register(Email(), "hashed", clock).Value;
        user.DeclareCareerAtRegistration(Guid.NewGuid(), Guid.NewGuid(), clock);

        var result = user.Deactivate("deleted-career-decl@anonymized.local", clock);

        result.IsSuccess.ShouldBeTrue();
        user.PendingCareerPlanId.ShouldBeNull();
        user.PendingCareerId.ShouldBeNull();
    }

    [Fact]
    public void ExpireRegistration_clears_the_pending_career_declaration()
    {
        var clock = new FixedClock(T0);
        var user = User.Register(Email(), "hashed", clock).Value;
        user.DeclareCareerAtRegistration(Guid.NewGuid(), Guid.NewGuid(), clock);

        var result = user.ExpireRegistration(clock);

        result.IsSuccess.ShouldBeTrue();
        user.PendingCareerPlanId.ShouldBeNull();
        user.PendingCareerId.ShouldBeNull();
    }
}
