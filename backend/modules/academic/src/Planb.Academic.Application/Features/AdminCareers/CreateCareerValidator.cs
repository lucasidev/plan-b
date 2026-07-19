using FluentValidation;

namespace Planb.Academic.Application.Features.AdminCareers;

internal sealed class CreateCareerValidator : AbstractValidator<CreateCareerCommand>
{
    public CreateCareerValidator()
    {
        RuleFor(c => c.Name).NotEmpty();
        RuleFor(c => c.Slug).NotEmpty();
    }
}
