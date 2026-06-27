using FluentValidation;

namespace Planb.Identity.Application.Features.SubmitInstitutionalEmail;

internal sealed class SubmitInstitutionalEmailValidator
    : AbstractValidator<SubmitInstitutionalEmailCommand>
{
    public SubmitInstitutionalEmailValidator()
    {
        RuleFor(c => c.ClaimId).NotEmpty();
        RuleFor(c => c.Email)
            .NotEmpty()
            .WithMessage("Ingresá tu email institucional.");
    }
}
