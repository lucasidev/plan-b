using FluentValidation;

namespace Planb.Identity.Application.Features.InitiateTeacherClaim;

internal sealed class InitiateTeacherClaimValidator : AbstractValidator<InitiateTeacherClaimCommand>
{
    public InitiateTeacherClaimValidator()
    {
        RuleFor(c => c.TeacherId)
            .NotEmpty()
            .WithMessage("A teacher must be selected to start a claim.");
    }
}
