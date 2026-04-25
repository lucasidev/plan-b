using Planb.Identity.Domain.EmailVerifications;
using Planb.Identity.Domain.EmailVerifications.Events;
using Planb.Identity.Domain.Users;
using Planb.Identity.Tests.Users;
using Shouldly;
using Xunit;

namespace Planb.Identity.Tests.EmailVerifications;

public class EmailVerificationTokenTests
{
    private static readonly DateTimeOffset T0 = new(2026, 4, 24, 12, 0, 0, TimeSpan.Zero);
    private static readonly TimeSpan Ttl = TimeSpan.FromHours(24);
    private static readonly UserId SomeUser = UserId.New();

    [Fact]
    public void Issue_creates_token_with_expiry_and_raises_event()
    {
        var clock = new FixedClock(T0);

        var result = EmailVerificationToken.Issue(SomeUser, "raw-token", Ttl, clock);

        result.IsSuccess.ShouldBeTrue();
        var token = result.Value;
        token.UserId.ShouldBe(SomeUser);
        token.Token.ShouldBe("raw-token");
        token.IssuedAt.ShouldBe(T0);
        token.ExpiresAt.ShouldBe(T0.Add(Ttl));
        token.ConsumedAt.ShouldBeNull();
        token.IsConsumed.ShouldBeFalse();
        token.IsExpired(T0).ShouldBeFalse();

        var @event = token.DomainEvents.OfType<EmailVerificationTokenIssuedDomainEvent>()
            .ShouldHaveSingleItem();
        @event.UserId.ShouldBe(SomeUser);
        @event.Token.ShouldBe("raw-token");
        @event.ExpiresAt.ShouldBe(T0.Add(Ttl));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Issue_rejects_blank_token(string? raw)
    {
        var result = EmailVerificationToken.Issue(SomeUser, raw!, Ttl, new FixedClock(T0));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(EmailVerificationTokenErrors.TokenRequired);
    }

    [Fact]
    public void Issue_rejects_zero_or_negative_ttl()
    {
        var result = EmailVerificationToken.Issue(
            SomeUser, "raw", TimeSpan.Zero, new FixedClock(T0));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(EmailVerificationTokenErrors.TtlMustBePositive);
    }

    [Fact]
    public void Consume_marks_token_consumed_when_within_ttl()
    {
        var clock = new FixedClock(T0);
        var token = EmailVerificationToken.Issue(SomeUser, "raw", Ttl, clock).Value;

        clock.Advance(TimeSpan.FromMinutes(5));
        var result = token.Consume(clock);

        result.IsSuccess.ShouldBeTrue();
        token.IsConsumed.ShouldBeTrue();
        token.ConsumedAt.ShouldBe(T0.AddMinutes(5));
    }

    [Fact]
    public void Consume_fails_when_already_consumed()
    {
        var clock = new FixedClock(T0);
        var token = EmailVerificationToken.Issue(SomeUser, "raw", Ttl, clock).Value;
        token.Consume(clock).IsSuccess.ShouldBeTrue();

        var second = token.Consume(clock);

        second.IsFailure.ShouldBeTrue();
        second.Error.ShouldBe(EmailVerificationTokenErrors.AlreadyConsumed);
    }

    [Fact]
    public void Consume_fails_when_expired()
    {
        var clock = new FixedClock(T0);
        var token = EmailVerificationToken.Issue(SomeUser, "raw", Ttl, clock).Value;

        clock.Advance(Ttl + TimeSpan.FromMinutes(1));
        var result = token.Consume(clock);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(EmailVerificationTokenErrors.Expired);
        token.IsConsumed.ShouldBeFalse();
    }
}
