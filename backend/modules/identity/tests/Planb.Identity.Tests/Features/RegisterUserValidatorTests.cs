using FluentValidation.TestHelper;
using Planb.Identity.Application.Features.RegisterUser;
using Xunit;

namespace Planb.Identity.Tests.Features;

public class RegisterUserValidatorTests
{
    private readonly RegisterUserValidator _validator = new();

    private static RegisterUserCommand ValidCommand(
        string email = "lucas@unsta.edu.ar",
        string? password = null,
        Guid? careerId = null,
        Guid? careerPlanId = null) =>
        new(email, password ?? new string('a', 12), careerId ?? Guid.NewGuid(), careerPlanId ?? Guid.NewGuid());

    [Fact]
    public void Valid_email_password_and_career_plan_passes()
    {
        var cmd = ValidCommand();

        _validator.TestValidate(cmd).ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Empty_email_fails(string email)
    {
        var cmd = ValidCommand(email: email);

        _validator.TestValidate(cmd).ShouldHaveValidationErrorFor(c => c.Email);
    }

    [Fact]
    public void Email_longer_than_254_chars_fails()
    {
        var local = new string('a', 250);
        var email = $"{local}@x.io"; // 256 chars
        var cmd = ValidCommand(email: email);

        _validator.TestValidate(cmd).ShouldHaveValidationErrorFor(c => c.Email);
    }

    [Theory]
    [InlineData("")]
    [InlineData("short")]
    [InlineData("eleven_chrs")] // 11 chars, just under the floor
    public void Short_password_fails(string password)
    {
        var cmd = ValidCommand(password: password);

        _validator.TestValidate(cmd).ShouldHaveValidationErrorFor(c => c.Password);
    }

    [Fact]
    public void Password_at_minimum_length_passes()
    {
        var cmd = ValidCommand(password: new string('a', RegisterUserValidator.MinPasswordLength));

        _validator.TestValidate(cmd).ShouldNotHaveValidationErrorFor(c => c.Password);
    }

    [Fact]
    public void Empty_career_plan_id_fails()
    {
        var cmd = ValidCommand(careerPlanId: Guid.Empty);

        _validator.TestValidate(cmd).ShouldHaveValidationErrorFor(c => c.CareerPlanId);
    }

    [Fact]
    public void Missing_career_plan_id_passes()
    {
        var cmd = new RegisterUserCommand(
            "lucas@unsta.edu.ar", new string('a', 12), Guid.NewGuid(), CareerPlanId: null);

        _validator.TestValidate(cmd).ShouldNotHaveValidationErrorFor(c => c.CareerPlanId);
    }

    [Fact]
    public void Empty_career_id_fails_when_there_is_no_career_plan_id()
    {
        var cmd = new RegisterUserCommand(
            "lucas@unsta.edu.ar", new string('a', 12), Guid.Empty, CareerPlanId: null);

        _validator.TestValidate(cmd).ShouldHaveValidationErrorFor(c => c.CareerId);
    }

    [Fact]
    public void Empty_career_id_passes_when_a_career_plan_id_is_present()
    {
        // El plan identifica la carrera transitivamente: pedir las dos cosas era redundante y
        // rompía a todo cliente que ya mandaba solo el plan.
        var cmd = ValidCommand(careerId: Guid.Empty);

        _validator.TestValidate(cmd).ShouldNotHaveValidationErrorFor(c => c.CareerId);
    }
}
