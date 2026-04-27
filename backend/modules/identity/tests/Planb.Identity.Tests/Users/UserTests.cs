using Planb.Identity.Domain.Users;
using Planb.Identity.Domain.Users.Events;
using Shouldly;
using Xunit;

namespace Planb.Identity.Tests.Users;

public class UserTests
{
    private static readonly DateTimeOffset T0 = new(2026, 4, 24, 12, 0, 0, TimeSpan.Zero);

    private static EmailAddress Email(string raw = "lucas@unsta.edu.ar") =>
        EmailAddress.Create(raw).Value;

    [Fact]
    public void Register_creates_member_with_unverified_email_and_stamps_timestamps()
    {
        var clock = new FixedClock(T0);

        var result = User.Register(Email(), "hashed", clock);

        result.IsSuccess.ShouldBeTrue();
        var user = result.Value;

        user.Id.Value.ShouldNotBe(Guid.Empty);
        user.Email.ShouldBe(Email());
        user.PasswordHash.ShouldBe("hashed");
        user.Role.ShouldBe(UserRole.Member);
        user.EmailVerifiedAt.ShouldBeNull();
        user.DisabledAt.ShouldBeNull();
        user.IsActive.ShouldBeFalse();
        user.CreatedAt.ShouldBe(T0);
        user.UpdatedAt.ShouldBe(T0);
    }

    [Fact]
    public void Register_raises_UserRegisteredDomainEvent()
    {
        var clock = new FixedClock(T0);

        var user = User.Register(Email(), "hashed", clock).Value;

        var @event = user.DomainEvents.OfType<UserRegisteredDomainEvent>().ShouldHaveSingleItem();
        @event.UserId.ShouldBe(user.Id);
        @event.Email.ShouldBe(Email());
        @event.OccurredAt.ShouldBe(T0);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Register_fails_when_password_hash_is_blank(string? hash)
    {
        var result = User.Register(Email(), hash!, new FixedClock(T0));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.PasswordHashRequired);
    }

    private static User RegisteredUserWithToken(
        FixedClock clock, string rawToken = "raw-token", TimeSpan? ttl = null)
    {
        var user = User.Register(Email(), "hashed", clock).Value;
        user.IssueVerificationToken(
            TokenPurpose.UserEmailVerification,
            rawToken,
            ttl ?? TimeSpan.FromHours(24),
            clock);
        return user;
    }

    [Fact]
    public void VerifyEmail_consumes_token_and_raises_event()
    {
        var clock = new FixedClock(T0);
        var user = RegisteredUserWithToken(clock);
        user.ClearDomainEvents();

        clock.Advance(TimeSpan.FromMinutes(5));
        var result = user.VerifyEmail("raw-token", clock);

        result.IsSuccess.ShouldBeTrue();
        user.EmailVerifiedAt.ShouldBe(T0.AddMinutes(5));
        user.UpdatedAt.ShouldBe(T0.AddMinutes(5));
        user.IsEmailVerified.ShouldBeTrue();
        var token = user.Tokens.ShouldHaveSingleItem();
        token.IsConsumed.ShouldBeTrue();
        user.DomainEvents.OfType<UserEmailVerifiedDomainEvent>().ShouldHaveSingleItem();
    }

    [Fact]
    public void VerifyEmail_is_idempotent_when_already_verified()
    {
        var clock = new FixedClock(T0);
        var user = RegisteredUserWithToken(clock);
        clock.Advance(TimeSpan.FromMinutes(5));
        user.VerifyEmail("raw-token", clock);
        var firstVerifiedAt = user.EmailVerifiedAt;
        user.ClearDomainEvents();

        clock.Advance(TimeSpan.FromHours(1));
        var second = user.VerifyEmail("raw-token", clock);

        second.IsSuccess.ShouldBeTrue();
        user.EmailVerifiedAt.ShouldBe(firstVerifiedAt);
        user.UpdatedAt.ShouldBe(firstVerifiedAt!.Value);
        user.DomainEvents.ShouldBeEmpty();
    }

    [Fact]
    public void VerifyEmail_fails_when_token_does_not_match()
    {
        var clock = new FixedClock(T0);
        var user = RegisteredUserWithToken(clock);

        var result = user.VerifyEmail("wrong-token", clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.VerificationTokenInvalid);
        user.IsEmailVerified.ShouldBeFalse();
    }

    [Fact]
    public void VerifyEmail_fails_when_token_is_expired()
    {
        var clock = new FixedClock(T0);
        var user = RegisteredUserWithToken(clock, ttl: TimeSpan.FromHours(1));

        clock.Advance(TimeSpan.FromHours(2));
        var result = user.VerifyEmail("raw-token", clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.VerificationTokenExpired);
        user.IsEmailVerified.ShouldBeFalse();
    }

    [Fact]
    public void IssueVerificationToken_invalidates_previous_active_token_of_same_purpose()
    {
        var clock = new FixedClock(T0);
        var user = RegisteredUserWithToken(clock, rawToken: "first");
        user.ClearDomainEvents();

        clock.Advance(TimeSpan.FromMinutes(10));
        user.IssueVerificationToken(
            TokenPurpose.UserEmailVerification,
            "second",
            TimeSpan.FromHours(24),
            clock);

        user.Tokens.Count.ShouldBe(2);
        var first = user.Tokens.Single(t => t.Token == "first");
        first.IsInvalidated.ShouldBeTrue();
        var second = user.Tokens.Single(t => t.Token == "second");
        second.IsActive.ShouldBeTrue();
        user.DomainEvents.OfType<VerificationTokenInvalidatedDomainEvent>().ShouldHaveSingleItem();
        user.DomainEvents.OfType<VerificationTokenIssuedDomainEvent>().ShouldHaveSingleItem();
    }

    [Fact]
    public void Disable_requires_a_reason()
    {
        var clock = new FixedClock(T0);
        var user = User.Register(Email(), "hashed", clock).Value;

        var result = user.Disable(Guid.NewGuid(), "  ", clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.DisableReasonRequired);
        user.DisabledAt.ShouldBeNull();
    }

    [Fact]
    public void Disable_sets_fields_raises_event_and_fails_if_called_again()
    {
        var clock = new FixedClock(T0);
        var user = User.Register(Email(), "hashed", clock).Value;
        user.ClearDomainEvents();
        var moderator = Guid.NewGuid();

        clock.Advance(TimeSpan.FromMinutes(10));
        user.Disable(moderator, "abuse", clock).IsSuccess.ShouldBeTrue();

        user.DisabledAt.ShouldBe(T0.AddMinutes(10));
        user.DisabledBy.ShouldBe(moderator);
        user.DisabledReason.ShouldBe("abuse");
        user.IsDisabled.ShouldBeTrue();
        var @event = user.DomainEvents.OfType<UserDisabledDomainEvent>().ShouldHaveSingleItem();
        @event.UserId.ShouldBe(user.Id);
        @event.DisabledBy.ShouldBe(moderator);
        @event.Reason.ShouldBe("abuse");

        var second = user.Disable(moderator, "abuse", clock);
        second.IsFailure.ShouldBeTrue();
        second.Error.ShouldBe(UserErrors.AlreadyDisabled);
    }

    [Fact]
    public void Restore_clears_fields_and_raises_event()
    {
        var clock = new FixedClock(T0);
        var user = User.Register(Email(), "hashed", clock).Value;
        user.Disable(Guid.NewGuid(), "abuse", clock);
        user.ClearDomainEvents();

        clock.Advance(TimeSpan.FromDays(3));
        var result = user.Restore(clock);

        result.IsSuccess.ShouldBeTrue();
        user.DisabledAt.ShouldBeNull();
        user.DisabledBy.ShouldBeNull();
        user.DisabledReason.ShouldBeNull();
        user.UpdatedAt.ShouldBe(T0.AddDays(3));
        user.DomainEvents.OfType<UserRestoredDomainEvent>().ShouldHaveSingleItem();
    }

    [Fact]
    public void Restore_fails_when_user_is_not_disabled()
    {
        var clock = new FixedClock(T0);
        var user = User.Register(Email(), "hashed", clock).Value;

        var result = user.Restore(clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.NotDisabled);
    }

    // ── Authenticate ─────────────────────────────────────────────────

    private static User VerifiedActiveUser(FixedClock clock)
    {
        var user = User.Register(Email(), "hashed", clock).Value;
        user.IssueVerificationToken(
            TokenPurpose.UserEmailVerification, "raw", TimeSpan.FromHours(24), clock);
        user.VerifyEmail("raw", clock);
        user.ClearDomainEvents();
        return user;
    }

    [Fact]
    public void Authenticate_succeeds_for_verified_active_user_with_correct_password()
    {
        var clock = new FixedClock(T0);
        var user = VerifiedActiveUser(clock);

        clock.Advance(TimeSpan.FromMinutes(1));
        var result = user.Authenticate(_ => true, clock);

        result.IsSuccess.ShouldBeTrue();
        var @event = user.DomainEvents.OfType<UserSignedInDomainEvent>().ShouldHaveSingleItem();
        @event.UserId.ShouldBe(user.Id);
        @event.OccurredAt.ShouldBe(T0.AddMinutes(1));
    }

    [Fact]
    public void Authenticate_returns_invalid_credentials_for_wrong_password_even_when_state_is_off()
    {
        // Anti-enumeration: a wrong password must yield InvalidCredentials regardless of
        // whether the account is unverified, disabled, or active. State-specific errors
        // (EmailNotVerified / AccountDisabled) only leak after the password is correct.
        var clock = new FixedClock(T0);

        var unverified = User.Register(Email("unverified@x.com"), "hashed", clock).Value;
        var disabled = VerifiedActiveUser(clock);
        disabled.Disable(Guid.NewGuid(), "abuse", clock);

        unverified.Authenticate(_ => false, clock).Error.ShouldBe(UserErrors.InvalidCredentials);
        disabled.Authenticate(_ => false, clock).Error.ShouldBe(UserErrors.InvalidCredentials);
    }

    [Fact]
    public void Authenticate_returns_email_not_verified_when_password_is_correct_but_email_pending()
    {
        var clock = new FixedClock(T0);
        var user = User.Register(Email(), "hashed", clock).Value;

        var result = user.Authenticate(_ => true, clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.EmailNotVerified);
        user.DomainEvents.OfType<UserSignedInDomainEvent>().ShouldBeEmpty();
    }

    [Fact]
    public void Authenticate_returns_account_disabled_when_password_is_correct_but_user_disabled()
    {
        var clock = new FixedClock(T0);
        var user = VerifiedActiveUser(clock);
        user.Disable(Guid.NewGuid(), "abuse", clock);

        var result = user.Authenticate(_ => true, clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.AccountDisabled);
        user.DomainEvents.OfType<UserSignedInDomainEvent>().ShouldBeEmpty();
    }

    [Fact]
    public void Authenticate_passes_the_stored_hash_to_the_verifier_callback()
    {
        var clock = new FixedClock(T0);
        var user = VerifiedActiveUser(clock);

        string? observed = null;
        user.Authenticate(hash => { observed = hash; return true; }, clock);

        observed.ShouldBe("hashed");
    }
}
