using Planb.Identity.Domain.Users;
using Shouldly;
using Xunit;

namespace Planb.Identity.Tests.Users;

public class EmailAddressTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_with_blank_value_fails_with_required(string? raw)
    {
        var result = EmailAddress.Create(raw);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.EmailRequired);
    }

    [Theory]
    [InlineData("no-at-sign")]
    [InlineData("@missinglocal.com")]
    [InlineData("missingdomain@")]
    [InlineData("two@at@signs.com")]
    [InlineData("no-dot@localhost")]
    [InlineData("trailing@domain.")]
    [InlineData("leading@.domain")]
    public void Create_with_invalid_format_fails(string raw)
    {
        var result = EmailAddress.Create(raw);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.EmailInvalidFormat);
    }

    [Fact]
    public void Create_rejects_email_longer_than_254_chars()
    {
        var raw = new string('a', 250) + "@x.io"; // 256 chars

        var result = EmailAddress.Create(raw);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(UserErrors.EmailTooLong);
    }

    [Fact]
    public void Create_normalizes_to_lowercase_and_trims()
    {
        var result = EmailAddress.Create("  User@Example.COM  ");

        result.IsSuccess.ShouldBeTrue();
        result.Value.Value.ShouldBe("user@example.com");
    }

    [Fact]
    public void Two_emails_differing_only_in_case_are_equal()
    {
        var a = EmailAddress.Create("user@x.com").Value;
        var b = EmailAddress.Create("USER@X.com").Value;

        a.ShouldBe(b);
        a.GetHashCode().ShouldBe(b.GetHashCode());
    }

    [Fact]
    public void Domain_returns_everything_after_at()
    {
        var email = EmailAddress.Create("lucas@unsta.edu.ar").Value;

        email.Domain.ShouldBe("unsta.edu.ar");
    }
}
