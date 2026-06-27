using FluentValidation;

namespace Planb.Identity.Application.Features.VerifyTeacherClaim;

internal sealed class VerifyTeacherClaimValidator : AbstractValidator<VerifyTeacherClaimCommand>
{
    public VerifyTeacherClaimValidator()
    {
        RuleFor(c => c.RawToken).NotEmpty();
    }
}
