using FluentValidation;
using Planb.Identity.Domain.Users;

namespace Planb.Identity.Application.Features.ChangePassword;

/// <summary>
/// Validator del comando. Solo cubre presencia + upper bounds. El min length, la verificación
/// de current y el "distinto al actual" los aplica el aggregate <see cref="User.ChangePassword"/>
/// para que el caller reciba codes específicos (<c>identity.password.too_weak</c>,
/// <c>identity.password.current_invalid</c>, <c>identity.password.same_as_current</c>) en lugar
/// de un genérico de validation.
/// </summary>
internal sealed class ChangePasswordValidator : AbstractValidator<ChangePasswordCommand>
{
    public ChangePasswordValidator()
    {
        RuleFor(c => c.UserId.Value).NotEmpty();
        RuleFor(c => c.CurrentPassword).NotEmpty().MaximumLength(User.MaxPasswordLength);
        RuleFor(c => c.NewPassword).NotEmpty().MaximumLength(User.MaxPasswordLength);
    }
}
