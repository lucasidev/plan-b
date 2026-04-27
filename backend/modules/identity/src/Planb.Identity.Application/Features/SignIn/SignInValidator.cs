using FluentValidation;

namespace Planb.Identity.Application.Features.SignIn;

internal sealed class SignInValidator : AbstractValidator<SignInCommand>
{
    public SignInValidator()
    {
        RuleFor(c => c.Email).NotEmpty().MaximumLength(254);
        // Don't enforce min length here. The register endpoint is the one that gates
        // password rules; sign-in just attempts authentication and lets the domain decide.
        RuleFor(c => c.Password).NotEmpty();
    }
}
