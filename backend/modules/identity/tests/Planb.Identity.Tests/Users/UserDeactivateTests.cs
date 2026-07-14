using Planb.Identity.Domain.Users;
using Planb.Identity.Domain.Users.Events;
using Shouldly;
using Xunit;

namespace Planb.Identity.Tests.Users;

/// <summary>
/// Domain unit tests para <see cref="User.Deactivate"/> (ADR-0044, US-038-bis). Cubre el
/// soft-delete con anonimización: swap de email, blank del password hash, limpieza de las
/// owned collections con PII, el domain event y la guarda de idempotencia.
/// </summary>
public class UserDeactivateTests
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

    [Fact]
    public void Deactivate_swaps_email_to_anonymized_value_and_blanks_password_hash()
    {
        var clock = new FixedClock(T0);
        var user = VerifiedActiveUser(clock);
        const string anonymized = "deleted-abc123@anonymized.local";

        clock.Advance(TimeSpan.FromMinutes(5));
        var result = user.Deactivate(anonymized, clock);

        result.IsSuccess.ShouldBeTrue();
        user.Email.Value.ShouldBe(anonymized);
        user.PasswordHash.ShouldBe(User.DeactivatedPasswordSentinel);
        user.DeactivatedAt.ShouldBe(T0.AddMinutes(5));
        user.UpdatedAt.ShouldBe(T0.AddMinutes(5));
        user.IsDeactivated.ShouldBeTrue();
    }

    [Fact]
    public void Deactivate_clears_tokens_and_student_profiles()
    {
        var clock = new FixedClock(T0);
        var user = VerifiedActiveUser(clock);
        user.AddStudentProfile(Guid.NewGuid(), Guid.NewGuid(), 2024, clock);
        user.RequestPasswordReset("reset-token", clock);
        user.Tokens.ShouldNotBeEmpty();
        user.StudentProfiles.ShouldNotBeEmpty();

        var result = user.Deactivate("deleted-xyz@anonymized.local", clock);

        result.IsSuccess.ShouldBeTrue();
        user.Tokens.ShouldBeEmpty();
        user.StudentProfiles.ShouldBeEmpty();
    }

    [Fact]
    public void Deactivate_raises_UserAccountDeactivatedDomainEvent()
    {
        var clock = new FixedClock(T0);
        var user = VerifiedActiveUser(clock);
        user.ClearDomainEvents();

        clock.Advance(TimeSpan.FromMinutes(2));
        var result = user.Deactivate("deleted-xyz@anonymized.local", clock);

        result.IsSuccess.ShouldBeTrue();
        var @event = user.DomainEvents
            .OfType<UserAccountDeactivatedDomainEvent>()
            .ShouldHaveSingleItem();
        @event.UserId.ShouldBe(user.Id);
        @event.OccurredAt.ShouldBe(clock.UtcNow);
    }

    [Fact]
    public void Deactivate_fails_with_AlreadyDeactivated_when_called_a_second_time()
    {
        var clock = new FixedClock(T0);
        var user = VerifiedActiveUser(clock);
        user.Deactivate("deleted-xyz@anonymized.local", clock).IsSuccess.ShouldBeTrue();
        var emailAfterFirst = user.Email;

        var second = user.Deactivate("deleted-other@anonymized.local", clock);

        second.IsFailure.ShouldBeTrue();
        second.Error.ShouldBe(UserErrors.AlreadyDeactivated);
        // Idempotency guard: the second call is rejected before mutating anything further.
        user.Email.ShouldBe(emailAfterFirst);
    }

    [Fact]
    public void Deactivate_fails_and_does_not_mutate_state_when_anonymized_email_is_invalid()
    {
        var clock = new FixedClock(T0);
        var user = VerifiedActiveUser(clock);
        var emailBefore = user.Email;
        var passwordHashBefore = user.PasswordHash;

        var result = user.Deactivate("not-an-email", clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.EmailInvalidFormat);
        user.Email.ShouldBe(emailBefore);
        user.PasswordHash.ShouldBe(passwordHashBefore);
        user.IsDeactivated.ShouldBeFalse();
    }
}
