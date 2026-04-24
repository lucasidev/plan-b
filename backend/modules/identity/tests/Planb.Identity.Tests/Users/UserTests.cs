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

    [Fact]
    public void MarkEmailVerified_sets_timestamp_and_raises_event_on_first_call()
    {
        var clock = new FixedClock(T0);
        var user = User.Register(Email(), "hashed", clock).Value;
        user.ClearDomainEvents();

        clock.Advance(TimeSpan.FromMinutes(5));
        user.MarkEmailVerified(clock);

        user.EmailVerifiedAt.ShouldBe(T0.AddMinutes(5));
        user.UpdatedAt.ShouldBe(T0.AddMinutes(5));
        user.IsEmailVerified.ShouldBeTrue();
        user.DomainEvents.OfType<UserEmailVerifiedDomainEvent>().ShouldHaveSingleItem();
    }

    [Fact]
    public void MarkEmailVerified_is_idempotent_and_emits_no_extra_event()
    {
        var clock = new FixedClock(T0);
        var user = User.Register(Email(), "hashed", clock).Value;
        clock.Advance(TimeSpan.FromMinutes(5));
        user.MarkEmailVerified(clock);
        user.ClearDomainEvents();
        var firstVerifiedAt = user.EmailVerifiedAt;

        clock.Advance(TimeSpan.FromHours(1));
        user.MarkEmailVerified(clock);

        user.EmailVerifiedAt.ShouldBe(firstVerifiedAt);
        user.UpdatedAt.ShouldBe(firstVerifiedAt!.Value);
        user.DomainEvents.ShouldBeEmpty();
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
}
