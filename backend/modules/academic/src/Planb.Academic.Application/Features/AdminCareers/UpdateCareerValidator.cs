using FluentValidation;

namespace Planb.Academic.Application.Features.AdminCareers;

internal sealed class UpdateCareerValidator : AbstractValidator<UpdateCareerCommand>
{
    public UpdateCareerValidator()
    {
        RuleFor(c => c.Name).NotEmpty();
        RuleFor(c => c.Slug).NotEmpty();
    }
}
