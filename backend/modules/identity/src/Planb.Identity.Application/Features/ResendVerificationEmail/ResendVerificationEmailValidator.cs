using FluentValidation;

namespace Planb.Identity.Application.Features.ResendVerificationEmail;

internal sealed class ResendVerificationEmailValidator : AbstractValidator<ResendVerificationEmailCommand>
{
    public const int MaxEmailLength = 254;

    public ResendVerificationEmailValidator()
    {
        // Don't validate format here. Anti-enumeration: malformed input goes down the same
        // silent-success path as unknown emails. The handler is the one que mapea malformed
        // input a "do nothing" sin decir por qué.
        RuleFor(c => c.Email).NotEmpty().MaximumLength(MaxEmailLength);
    }
}
