using FluentValidation;

namespace Planb.Identity.Application.Features.RegisterUser;

internal sealed class RegisterUserValidator : AbstractValidator<RegisterUserCommand>
{
    /// <summary>
    /// NIST 800-63B aligned: prefer length over complexity rules. 12 chars is the modern floor.
    /// </summary>
    public const int MinPasswordLength = 12;
    public const int MaxPasswordLength = 256;
    public const int MaxEmailLength = 254;

    public RegisterUserValidator()
    {
        RuleFor(c => c.Email)
            .NotEmpty()
            .MaximumLength(MaxEmailLength);

        RuleFor(c => c.Password)
            .NotEmpty()
            .MinimumLength(MinPasswordLength)
            .MaximumLength(MaxPasswordLength);
    }
}
