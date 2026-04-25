using FluentValidation.TestHelper;
using Planb.Identity.Application.Features.RegisterUser;
using Xunit;

namespace Planb.Identity.Tests.Features;

public class RegisterUserValidatorTests
{
    private readonly RegisterUserValidator _validator = new();

    [Fact]
    public void Valid_email_and_password_passes()
    {
        var cmd = new RegisterUserCommand("lucas@unsta.edu.ar", new string('a', 12));

        _validator.TestValidate(cmd).ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Empty_email_fails(string email)
    {
        var cmd = new RegisterUserCommand(email, new string('a', 12));

        _validator.TestValidate(cmd).ShouldHaveValidationErrorFor(c => c.Email);
    }

    [Fact]
    public void Email_longer_than_254_chars_fails()
    {
        var local = new string('a', 250);
        var email = $"{local}@x.io"; // 256 chars
        var cmd = new RegisterUserCommand(email, new string('a', 12));

        _validator.TestValidate(cmd).ShouldHaveValidationErrorFor(c => c.Email);
    }

    [Theory]
    [InlineData("")]
    [InlineData("short")]
    [InlineData("eleven_chrs")] // 11 chars, just under the floor
    public void Short_password_fails(string password)
    {
        var cmd = new RegisterUserCommand("lucas@unsta.edu.ar", password);

        _validator.TestValidate(cmd).ShouldHaveValidationErrorFor(c => c.Password);
    }

    [Fact]
    public void Password_at_minimum_length_passes()
    {
        var cmd = new RegisterUserCommand(
            "lucas@unsta.edu.ar",
            new string('a', RegisterUserValidator.MinPasswordLength));

        _validator.TestValidate(cmd).ShouldNotHaveValidationErrorFor(c => c.Password);
    }
}
