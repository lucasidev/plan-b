using Planb.Identity.Domain.Users;
using Shouldly;
using Xunit;

namespace Planb.Identity.Tests.Users;

/// <summary>
/// Domain unit tests para <see cref="User.UpdateActiveStudentProfile"/> (US-047). Cubre las 5
/// ramas de validación (en orden) y el happy path de patch parcial sobre el StudentProfile activo.
/// </summary>
public class UserUpdateActiveStudentProfileTests
{
    private static readonly DateTimeOffset T0 = new(2026, 4, 24, 12, 0, 0, TimeSpan.Zero);

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

    private static User VerifiedActiveUserWithProfile(FixedClock clock)
    {
        var user = VerifiedActiveUser(clock);
        user.AddStudentProfile(Guid.NewGuid(), Guid.NewGuid(), 2024, clock);
        user.ClearDomainEvents();
        return user;
    }

    [Fact]
    public void UpdateActiveStudentProfile_fails_with_AccountNotActive_when_email_not_verified()
    {
        var clock = new FixedClock(T0);
        var user = User.Register(Email(), "hashed", clock).Value;

        var result = user.UpdateActiveStudentProfile("Lucas", 3, "12345", true, clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.AccountNotActive);
    }

    [Fact]
    public void UpdateActiveStudentProfile_fails_with_StudentProfileNotFound_when_user_has_no_profile()
    {
        var clock = new FixedClock(T0);
        var user = VerifiedActiveUser(clock);

        var result = user.UpdateActiveStudentProfile("Lucas", 3, "12345", true, clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.StudentProfileNotFound);
    }

    [Fact]
    public void UpdateActiveStudentProfile_fails_with_DisplayNameInvalid_when_blank_after_trim()
    {
        var clock = new FixedClock(T0);
        var user = VerifiedActiveUserWithProfile(clock);

        var result = user.UpdateActiveStudentProfile("   ", null, null, null, clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.DisplayNameInvalid);
        user.StudentProfiles.Single().DisplayName.ShouldBeNull();
    }

    [Fact]
    public void UpdateActiveStudentProfile_fails_with_DisplayNameInvalid_when_over_max_length()
    {
        var clock = new FixedClock(T0);
        var user = VerifiedActiveUserWithProfile(clock);
        var tooLong = new string('a', User.MaxDisplayNameLength + 1);

        var result = user.UpdateActiveStudentProfile(tooLong, null, null, null, clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.DisplayNameInvalid);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(9)]
    public void UpdateActiveStudentProfile_fails_with_YearOfStudyOutOfRange(int year)
    {
        var clock = new FixedClock(T0);
        var user = VerifiedActiveUserWithProfile(clock);

        var result = user.UpdateActiveStudentProfile(null, year, null, null, clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.YearOfStudyOutOfRange);
    }

    [Fact]
    public void UpdateActiveStudentProfile_fails_with_LegajoInvalid_when_over_max_length()
    {
        var clock = new FixedClock(T0);
        var user = VerifiedActiveUserWithProfile(clock);
        var tooLong = new string('9', User.MaxLegajoLength + 1);

        var result = user.UpdateActiveStudentProfile(null, null, tooLong, null, clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.LegajoInvalid);
    }

    [Fact]
    public void UpdateActiveStudentProfile_updates_the_active_profile_and_trims_display_name()
    {
        var clock = new FixedClock(T0);
        var user = VerifiedActiveUserWithProfile(clock);

        clock.Advance(TimeSpan.FromMinutes(10));
        var result = user.UpdateActiveStudentProfile("  Lucas Iriarte  ", 3, "A-123", false, clock);

        result.IsSuccess.ShouldBeTrue();
        var profile = user.StudentProfiles.Single();
        profile.DisplayName.ShouldBe("Lucas Iriarte");
        profile.YearOfStudy.ShouldBe(3);
        profile.Legajo.ShouldBe("A-123");
        profile.RegularStudent.ShouldBeFalse();
        user.UpdatedAt.ShouldBe(clock.UtcNow);
    }

    [Fact]
    public void UpdateActiveStudentProfile_ignores_null_arguments_and_only_patches_given_fields()
    {
        var clock = new FixedClock(T0);
        var user = VerifiedActiveUserWithProfile(clock);
        user.UpdateActiveStudentProfile("Lucas Iriarte", 2, "A-999", true, clock);

        var result = user.UpdateActiveStudentProfile(null, 4, null, null, clock);

        result.IsSuccess.ShouldBeTrue();
        var profile = user.StudentProfiles.Single();
        profile.DisplayName.ShouldBe("Lucas Iriarte");
        profile.YearOfStudy.ShouldBe(4);
        profile.Legajo.ShouldBe("A-999");
        profile.RegularStudent.ShouldBeTrue();
    }
}
