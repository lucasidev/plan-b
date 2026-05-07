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

    // ── RequestPasswordReset ─────────────────────────────────────────

    [Fact]
    public void RequestPasswordReset_issues_token_with_password_reset_purpose_and_30min_ttl()
    {
        var clock = new FixedClock(T0);
        var user = VerifiedActiveUser(clock);
        // VerifiedActiveUser dejó un UserEmailVerification token consumido en Tokens.
        // Filtramos por purpose para apuntar al password-reset que recién se issue.

        var result = user.RequestPasswordReset("reset-token", clock);

        result.IsSuccess.ShouldBeTrue();
        var token = user.Tokens.Single(t => t.Purpose == TokenPurpose.PasswordReset);
        token.Token.ShouldBe("reset-token");
        token.ExpiresAt.ShouldBe(T0.AddMinutes(30));
        token.IsActive.ShouldBeTrue();
        user.DomainEvents.OfType<VerificationTokenIssuedDomainEvent>().ShouldHaveSingleItem();
    }

    [Fact]
    public void RequestPasswordReset_invalidates_previous_active_password_reset_token()
    {
        var clock = new FixedClock(T0);
        var user = VerifiedActiveUser(clock);
        user.RequestPasswordReset("first", clock);
        user.ClearDomainEvents();

        clock.Advance(TimeSpan.FromMinutes(5));
        user.RequestPasswordReset("second", clock);

        // Sólo nos importa el comportamiento entre los dos password-reset tokens.
        // (En total user tiene 1 verify consumido + 2 password-reset = 3 tokens.)
        user.Tokens.Single(t => t.Token == "first").IsInvalidated.ShouldBeTrue();
        user.Tokens.Single(t => t.Token == "second").IsActive.ShouldBeTrue();
        user.DomainEvents.OfType<VerificationTokenInvalidatedDomainEvent>().ShouldHaveSingleItem();
    }

    [Fact]
    public void RequestPasswordReset_succeeds_at_aggregate_level_even_for_disabled_user()
    {
        // The aggregate doesn't gate on user state — that's the handler's job
        // (anti-enumeration: handler decides whether to actually send mail).
        // Documented in the User.RequestPasswordReset docstring.
        var clock = new FixedClock(T0);
        var user = VerifiedActiveUser(clock);
        user.Disable(Guid.NewGuid(), "abuse", clock);

        var result = user.RequestPasswordReset("reset-token", clock);

        result.IsSuccess.ShouldBeTrue();
    }

    // ── ResetPassword ────────────────────────────────────────────────

    private static User UserWithPasswordResetToken(
        FixedClock clock, string token = "raw-reset", TimeSpan? ttl = null)
    {
        var user = VerifiedActiveUser(clock);
        user.IssueVerificationToken(
            TokenPurpose.PasswordReset, token, ttl ?? TimeSpan.FromMinutes(30), clock);
        user.ClearDomainEvents();
        return user;
    }

    [Fact]
    public void ResetPassword_consumes_token_replaces_hash_and_raises_event()
    {
        var clock = new FixedClock(T0);
        var user = UserWithPasswordResetToken(clock);

        clock.Advance(TimeSpan.FromMinutes(5));
        var result = user.ResetPassword(
            "raw-reset",
            new string('x', User.MinPasswordLength),
            plain => $"hashed:{plain}",
            clock);

        result.IsSuccess.ShouldBeTrue();
        user.PasswordHash.ShouldBe($"hashed:{new string('x', User.MinPasswordLength)}");
        user.UpdatedAt.ShouldBe(T0.AddMinutes(5));
        var token = user.Tokens.Single(t => t.Token == "raw-reset");
        token.IsConsumed.ShouldBeTrue();
        var @event = user.DomainEvents.OfType<PasswordResetCompletedDomainEvent>().ShouldHaveSingleItem();
        @event.UserId.ShouldBe(user.Id);
        @event.OccurredAt.ShouldBe(T0.AddMinutes(5));
    }

    [Fact]
    public void ResetPassword_fails_with_VerificationTokenInvalid_when_token_does_not_exist()
    {
        var clock = new FixedClock(T0);
        var user = UserWithPasswordResetToken(clock);

        var result = user.ResetPassword("wrong-token", "any-pw-12345", _ => "h", clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.VerificationTokenInvalid);
        user.PasswordHash.ShouldBe("hashed"); // unchanged
    }

    [Fact]
    public void ResetPassword_fails_with_WrongPurpose_when_token_belongs_to_email_verification()
    {
        var clock = new FixedClock(T0);
        var user = User.Register(Email("new@x.com"), "hashed", clock).Value;
        user.IssueVerificationToken(
            TokenPurpose.UserEmailVerification, "verify-token", TimeSpan.FromHours(24), clock);

        var result = user.ResetPassword("verify-token", "any-pw-12345", _ => "h", clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.VerificationWrongPurpose);
    }

    [Fact]
    public void ResetPassword_fails_with_AlreadyConsumed_when_token_already_used()
    {
        var clock = new FixedClock(T0);
        var user = UserWithPasswordResetToken(clock);
        user.ResetPassword(
            "raw-reset", new string('x', User.MinPasswordLength), _ => "h", clock);

        var second = user.ResetPassword(
            "raw-reset", new string('y', User.MinPasswordLength), _ => "h2", clock);

        second.IsFailure.ShouldBeTrue();
        second.Error.ShouldBe(UserErrors.VerificationTokenAlreadyConsumed);
    }

    [Fact]
    public void ResetPassword_fails_with_Expired_when_token_past_ttl()
    {
        var clock = new FixedClock(T0);
        var user = UserWithPasswordResetToken(clock, ttl: TimeSpan.FromMinutes(30));

        clock.Advance(TimeSpan.FromHours(1));
        var result = user.ResetPassword(
            "raw-reset", new string('x', User.MinPasswordLength), _ => "h", clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.VerificationTokenExpired);
    }

    [Fact]
    public void ResetPassword_fails_with_AccountDisabled_when_user_disabled_after_token_issued()
    {
        var clock = new FixedClock(T0);
        var user = UserWithPasswordResetToken(clock);
        user.Disable(Guid.NewGuid(), "abuse", clock);

        var result = user.ResetPassword(
            "raw-reset", new string('x', User.MinPasswordLength), _ => "h", clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.AccountDisabled);
    }

    [Fact]
    public void ResetPassword_fails_with_PasswordTooWeak_when_under_minimum()
    {
        var clock = new FixedClock(T0);
        var user = UserWithPasswordResetToken(clock);

        var result = user.ResetPassword(
            "raw-reset", new string('x', User.MinPasswordLength - 1), _ => "h", clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.PasswordTooWeak);
        // Token should NOT be consumed when password fails validation — user can retry.
        user.Tokens.Single(t => t.Token == "raw-reset").IsConsumed.ShouldBeFalse();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void ResetPassword_fails_with_TokenRequired_when_token_blank(string token)
    {
        var clock = new FixedClock(T0);
        var user = UserWithPasswordResetToken(clock);

        var result = user.ResetPassword(
            token, new string('x', User.MinPasswordLength), _ => "h", clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.VerificationTokenRequired);
    }

    // -- RequestVerificationResend (US-021) ----------------------------------------

    [Fact]
    public void RequestVerificationResend_issues_new_token_with_24h_ttl_and_invalidates_previous()
    {
        var clock = new FixedClock(T0);
        var user = RegisteredUserWithToken(clock, "original-token");
        user.ClearDomainEvents();

        clock.Advance(TimeSpan.FromMinutes(2));
        var result = user.RequestVerificationResend("regenerated-token", clock);

        result.IsSuccess.ShouldBeTrue();
        var tokens = user.Tokens
            .Where(t => t.Purpose == TokenPurpose.UserEmailVerification)
            .ToList();
        tokens.Count.ShouldBe(2);

        var original = tokens.Single(t => t.Token == "original-token");
        original.IsActive.ShouldBeFalse();
        original.IsInvalidated.ShouldBeTrue();

        var fresh = tokens.Single(t => t.Token == "regenerated-token");
        fresh.IsActive.ShouldBeTrue();
        fresh.ExpiresAt.ShouldBe(clock.UtcNow.AddHours(24));
    }

    [Fact]
    public void RequestVerificationResend_raises_invalidated_then_issued_events()
    {
        var clock = new FixedClock(T0);
        var user = RegisteredUserWithToken(clock, "original-token");
        user.ClearDomainEvents();

        user.RequestVerificationResend("regenerated-token", clock);

        user.DomainEvents.OfType<VerificationTokenInvalidatedDomainEvent>().Count().ShouldBe(1);
        user.DomainEvents.OfType<VerificationTokenIssuedDomainEvent>().Count().ShouldBe(1);
    }

    [Fact]
    public void RequestVerificationResend_works_when_no_previous_token_exists()
    {
        // Edge case: user que nunca tuvo un token (no debería pasar en práctica porque Register
        // emite uno, pero el aggregate no lo asume y resend funciona igual).
        var clock = new FixedClock(T0);
        var user = User.Register(Email(), "hashed", clock).Value;
        user.ClearDomainEvents();

        var result = user.RequestVerificationResend("fresh-token", clock);

        result.IsSuccess.ShouldBeTrue();
        var token = user.Tokens.Single(t => t.Purpose == TokenPurpose.UserEmailVerification);
        token.Token.ShouldBe("fresh-token");
        token.IsActive.ShouldBeTrue();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void RequestVerificationResend_fails_with_TokenRequired_when_token_blank(string token)
    {
        var clock = new FixedClock(T0);
        var user = RegisteredUserWithToken(clock);

        var result = user.RequestVerificationResend(token, clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.VerificationTokenRequired);
    }

    // -- ExpireRegistration (US-022) -----------------------------------------------

    [Fact]
    public void ExpireRegistration_marks_unverified_user_as_expired_and_invalidates_active_tokens()
    {
        var clock = new FixedClock(T0);
        var user = RegisteredUserWithToken(clock);
        user.ClearDomainEvents();

        clock.Advance(TimeSpan.FromDays(8));
        var result = user.ExpireRegistration(clock);

        result.IsSuccess.ShouldBeTrue();
        user.ExpiredAt.ShouldBe(clock.UtcNow);
        user.IsExpired.ShouldBeTrue();
        user.UpdatedAt.ShouldBe(clock.UtcNow);
        user.IsActive.ShouldBeFalse();

        var token = user.Tokens.ShouldHaveSingleItem();
        token.IsInvalidated.ShouldBeTrue();
    }

    [Fact]
    public void ExpireRegistration_raises_event_with_email_and_now()
    {
        var clock = new FixedClock(T0);
        var user = RegisteredUserWithToken(clock);
        user.ClearDomainEvents();

        clock.Advance(TimeSpan.FromDays(8));
        user.ExpireRegistration(clock);

        var @event = user.DomainEvents
            .OfType<UnverifiedRegistrationExpiredDomainEvent>()
            .ShouldHaveSingleItem();
        @event.UserId.ShouldBe(user.Id);
        @event.Email.ShouldBe(user.Email);
        @event.OccurredAt.ShouldBe(clock.UtcNow);

        // También levanta el invalidate del token activo.
        user.DomainEvents
            .OfType<VerificationTokenInvalidatedDomainEvent>()
            .ShouldHaveSingleItem();
    }

    [Fact]
    public void ExpireRegistration_fails_when_user_already_verified()
    {
        var clock = new FixedClock(T0);
        var user = RegisteredUserWithToken(clock);
        user.VerifyEmail("raw-token", clock);

        var result = user.ExpireRegistration(clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.NotEligibleForExpiration);
        user.ExpiredAt.ShouldBeNull();
    }

    [Fact]
    public void ExpireRegistration_fails_when_user_already_expired()
    {
        var clock = new FixedClock(T0);
        var user = RegisteredUserWithToken(clock);
        clock.Advance(TimeSpan.FromDays(8));
        user.ExpireRegistration(clock).IsSuccess.ShouldBeTrue();

        var second = user.ExpireRegistration(clock);

        second.IsFailure.ShouldBeTrue();
        second.Error.ShouldBe(UserErrors.NotEligibleForExpiration);
    }

    [Fact]
    public void ExpireRegistration_fails_when_user_disabled()
    {
        var clock = new FixedClock(T0);
        var user = RegisteredUserWithToken(clock);
        user.Disable(Guid.NewGuid(), "abuse", clock);

        var result = user.ExpireRegistration(clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.NotEligibleForExpiration);
        user.ExpiredAt.ShouldBeNull();
    }

    [Fact]
    public void IsActive_returns_false_for_expired_user_even_if_other_flags_match()
    {
        // Sanity check: la propiedad computed IsActive se contagia de IsExpired.
        var clock = new FixedClock(T0);
        var user = RegisteredUserWithToken(clock);
        clock.Advance(TimeSpan.FromDays(8));
        user.ExpireRegistration(clock);

        user.IsActive.ShouldBeFalse();
    }

    // -- AddStudentProfile (US-012) -----------------------------------------------
    // Reusa el helper VerifiedActiveUser definido más arriba.

    [Fact]
    public void AddStudentProfile_creates_active_profile_for_verified_member()
    {
        var clock = new FixedClock(T0);
        var user = VerifiedActiveUser(clock);
        var careerPlanId = Guid.NewGuid();
        var careerId = Guid.NewGuid();

        var result = user.AddStudentProfile(careerPlanId, careerId, 2024, clock);

        result.IsSuccess.ShouldBeTrue();
        var profile = result.Value;
        profile.CareerPlanId.ShouldBe(careerPlanId);
        profile.CareerId.ShouldBe(careerId);
        profile.EnrollmentYear.ShouldBe(2024);
        profile.Status.ShouldBe(StudentProfileStatus.Active);
        profile.IsActive.ShouldBeTrue();

        user.StudentProfiles.ShouldHaveSingleItem();
        user.UpdatedAt.ShouldBe(clock.UtcNow);
    }

    [Fact]
    public void AddStudentProfile_raises_StudentProfileCreatedDomainEvent()
    {
        var clock = new FixedClock(T0);
        var user = VerifiedActiveUser(clock);
        var careerPlanId = Guid.NewGuid();
        var careerId = Guid.NewGuid();

        user.AddStudentProfile(careerPlanId, careerId, 2024, clock);

        var @event = user.DomainEvents
            .OfType<StudentProfileCreatedDomainEvent>()
            .ShouldHaveSingleItem();
        @event.UserId.ShouldBe(user.Id);
        @event.CareerPlanId.ShouldBe(careerPlanId);
        @event.CareerId.ShouldBe(careerId);
        @event.EnrollmentYear.ShouldBe(2024);
        @event.OccurredAt.ShouldBe(clock.UtcNow);
    }

    [Fact]
    public void AddStudentProfile_fails_when_email_not_verified()
    {
        var clock = new FixedClock(T0);
        var user = RegisteredUserWithToken(clock);
        user.ClearDomainEvents();

        var result = user.AddStudentProfile(Guid.NewGuid(), Guid.NewGuid(), 2024, clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.EmailNotVerified);
        user.StudentProfiles.ShouldBeEmpty();
    }

    [Fact]
    public void AddStudentProfile_fails_when_user_disabled()
    {
        var clock = new FixedClock(T0);
        var user = VerifiedActiveUser(clock);
        user.Disable(Guid.NewGuid(), "abuse", clock);

        var result = user.AddStudentProfile(Guid.NewGuid(), Guid.NewGuid(), 2024, clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.AccountDisabled);
    }

    [Theory]
    [InlineData(2009)] // antes del MinEnrollmentYear
    [InlineData(2027)] // T0 está en 2026, así que 2027 es futuro
    public void AddStudentProfile_fails_when_year_out_of_range(int year)
    {
        var clock = new FixedClock(T0);
        var user = VerifiedActiveUser(clock);

        var result = user.AddStudentProfile(Guid.NewGuid(), Guid.NewGuid(), year, clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.EnrollmentYearOutOfRange);
        user.StudentProfiles.ShouldBeEmpty();
    }

    [Fact]
    public void AddStudentProfile_fails_when_active_profile_for_same_career_already_exists()
    {
        var clock = new FixedClock(T0);
        var user = VerifiedActiveUser(clock);
        var careerId = Guid.NewGuid();

        user.AddStudentProfile(Guid.NewGuid(), careerId, 2024, clock).IsSuccess.ShouldBeTrue();

        var second = user.AddStudentProfile(Guid.NewGuid(), careerId, 2024, clock);

        second.IsFailure.ShouldBeTrue();
        second.Error.ShouldBe(UserErrors.DuplicateStudentProfile);
        user.StudentProfiles.Count.ShouldBe(1);
    }

    [Fact]
    public void AddStudentProfile_allows_two_active_profiles_for_distinct_careers()
    {
        var clock = new FixedClock(T0);
        var user = VerifiedActiveUser(clock);

        user.AddStudentProfile(Guid.NewGuid(), Guid.NewGuid(), 2024, clock).IsSuccess.ShouldBeTrue();
        var second = user.AddStudentProfile(Guid.NewGuid(), Guid.NewGuid(), 2024, clock);

        second.IsSuccess.ShouldBeTrue();
        user.StudentProfiles.Count.ShouldBe(2);
    }

    [Fact]
    public void Delete_emits_UserAccountDeletedDomainEvent_with_user_id_email_and_clock_time()
    {
        var clock = new FixedClock(T0);
        var user = VerifiedActiveUser(clock);
        user.ClearDomainEvents();

        var result = user.Delete(clock);

        result.IsSuccess.ShouldBeTrue();
        var evt = user.DomainEvents.OfType<UserAccountDeletedDomainEvent>().ShouldHaveSingleItem();
        evt.UserId.ShouldBe(user.Id);
        evt.Email.ShouldBe(user.Email);
        evt.OccurredAt.ShouldBe(clock.UtcNow);
    }

    [Fact]
    public void Delete_does_not_mutate_aggregate_state()
    {
        // The aggregate is about to be removed at the persistence layer; Delete() only signals
        // intent via the domain event. State assertions guard against future regressions where
        // someone adds disabling-style mutations and breaks idempotency or removes the right of
        // erasure semantics (we want hard delete, not soft).
        var clock = new FixedClock(T0);
        var user = VerifiedActiveUser(clock);
        var emailBefore = user.Email;
        var roleBefore = user.Role;
        var verifiedAtBefore = user.EmailVerifiedAt;

        user.Delete(clock);

        user.Email.ShouldBe(emailBefore);
        user.Role.ShouldBe(roleBefore);
        user.EmailVerifiedAt.ShouldBe(verifiedAtBefore);
        user.IsDisabled.ShouldBeFalse();
        user.IsExpired.ShouldBeFalse();
    }
}
