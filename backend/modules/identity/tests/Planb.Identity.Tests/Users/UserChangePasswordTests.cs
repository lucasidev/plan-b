using Planb.Identity.Domain.Users;
using Planb.Identity.Domain.Users.Events;
using Shouldly;
using Xunit;

namespace Planb.Identity.Tests.Users;

/// <summary>
/// Domain unit tests para <see cref="User.ChangePassword"/> (US-079-i). Cubre las 5 ramas de
/// falla, el orden de las guardas (una guarda temprana debe ganarle a una tardía aunque ambas
/// condiciones se cumplan) y el happy path.
/// </summary>
public class UserChangePasswordTests
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

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    public void ChangePassword_fails_with_PasswordCurrentInvalid_when_current_is_blank(string? current)
    {
        var clock = new FixedClock(T0);
        var user = VerifiedActiveUser(clock);

        var result = user.ChangePassword(current!, "new-password-5678", _ => true, plain => plain, clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.PasswordCurrentInvalid);
    }

    [Fact]
    public void ChangePassword_fails_with_PasswordCurrentInvalid_when_hash_does_not_match()
    {
        var clock = new FixedClock(T0);
        var user = VerifiedActiveUser(clock);

        var result = user.ChangePassword(
            "wrong-current", "new-password-5678", _ => false, plain => plain, clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.PasswordCurrentInvalid);
    }

    [Fact]
    public void ChangePassword_fails_with_AccountDisabled_when_user_disabled()
    {
        var clock = new FixedClock(T0);
        var user = VerifiedActiveUser(clock);
        user.Disable(Guid.NewGuid(), "abuse", clock);

        var result = user.ChangePassword(
            "current-pw-1234", "new-password-5678", _ => true, plain => plain, clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.AccountDisabled);
    }

    [Fact]
    public void ChangePassword_fails_with_PasswordTooWeak_when_new_password_under_minimum()
    {
        var clock = new FixedClock(T0);
        var user = VerifiedActiveUser(clock);

        var result = user.ChangePassword(
            "current-pw-1234",
            new string('a', User.MinPasswordLength - 1),
            _ => true,
            plain => plain,
            clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.PasswordTooWeak);
    }

    [Fact]
    public void ChangePassword_fails_with_PasswordTooLong_when_new_password_exceeds_max_length()
    {
        var clock = new FixedClock(T0);
        var user = VerifiedActiveUser(clock);
        var tooLong = new string('a', User.MaxPasswordLength + 1);

        var result = user.ChangePassword("current-pw-1234", tooLong, _ => true, plain => plain, clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.PasswordTooLong);
    }

    [Fact]
    public void ChangePassword_fails_with_PasswordSameAsCurrent_when_new_equals_current()
    {
        var clock = new FixedClock(T0);
        var user = VerifiedActiveUser(clock);
        const string same = "same-password-1234";

        var result = user.ChangePassword(same, same, _ => true, plain => plain, clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.PasswordSameAsCurrent);
    }

    [Fact]
    public void ChangePassword_checks_current_password_before_account_disabled()
    {
        // Orden de guardas: PasswordCurrentInvalid (guarda 1) le gana a AccountDisabled
        // (guarda 2) aunque ambas condiciones se cumplan.
        var clock = new FixedClock(T0);
        var user = VerifiedActiveUser(clock);
        user.Disable(Guid.NewGuid(), "abuse", clock);

        var result = user.ChangePassword(
            "wrong-current", "new-password-5678", _ => false, plain => plain, clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.PasswordCurrentInvalid);
    }

    [Fact]
    public void ChangePassword_checks_account_disabled_before_new_password_strength()
    {
        // Orden de guardas: AccountDisabled (guarda 2) le gana a PasswordTooWeak (guarda 3)
        // aunque la nueva password también sea inválida.
        var clock = new FixedClock(T0);
        var user = VerifiedActiveUser(clock);
        user.Disable(Guid.NewGuid(), "abuse", clock);

        var result = user.ChangePassword("current-pw-1234", "short", _ => true, plain => plain, clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.AccountDisabled);
    }

    [Fact]
    public void ChangePassword_checks_password_strength_before_same_as_current()
    {
        // Orden de guardas: PasswordTooWeak (guarda 3) le gana a PasswordSameAsCurrent
        // (guarda 5) cuando la nueva password es igual a la actual pero además débil.
        var clock = new FixedClock(T0);
        var user = VerifiedActiveUser(clock);
        const string weakAndSame = "short-pw";

        var result = user.ChangePassword(weakAndSame, weakAndSame, _ => true, plain => plain, clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.PasswordTooWeak);
    }

    [Fact]
    public void ChangePassword_succeeds_replaces_hash_bumps_updated_at_and_raises_event()
    {
        var clock = new FixedClock(T0);
        var user = VerifiedActiveUser(clock);
        user.ClearDomainEvents();

        clock.Advance(TimeSpan.FromMinutes(5));
        var result = user.ChangePassword(
            "old-password-1234",
            "new-password-5678",
            _ => true,
            plain => $"hashed:{plain}",
            clock);

        result.IsSuccess.ShouldBeTrue();
        user.PasswordHash.ShouldBe("hashed:new-password-5678");
        user.UpdatedAt.ShouldBe(T0.AddMinutes(5));
        var @event = user.DomainEvents.OfType<UserPasswordChangedDomainEvent>().ShouldHaveSingleItem();
        @event.UserId.ShouldBe(user.Id);
        @event.OccurredAt.ShouldBe(T0.AddMinutes(5));
    }
}
