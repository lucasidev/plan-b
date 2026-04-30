using FluentValidation;

namespace Planb.Identity.Application.Features.ResetPassword;

internal sealed class ResetPasswordValidator : AbstractValidator<ResetPasswordCommand>
{
    public const int MaxTokenLength = 128;
    public const int MaxPasswordLength = 256;

    public ResetPasswordValidator()
    {
        RuleFor(c => c.Token).NotEmpty().MaximumLength(MaxTokenLength);
        // Min length is enforced by the aggregate so the failure surfaces with the
        // identity.password.too_weak error code instead of a generic validation message.
        RuleFor(c => c.NewPassword).NotEmpty().MaximumLength(MaxPasswordLength);
    }
}
