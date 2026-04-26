using FluentValidation;

namespace Planb.Identity.Application.Features.VerifyEmail;

internal sealed class VerifyEmailValidator : AbstractValidator<VerifyEmailCommand>
{
    public const int MaxTokenLength = 128;

    public VerifyEmailValidator()
    {
        RuleFor(c => c.Token)
            .NotEmpty()
            .MaximumLength(MaxTokenLength);
    }
}
