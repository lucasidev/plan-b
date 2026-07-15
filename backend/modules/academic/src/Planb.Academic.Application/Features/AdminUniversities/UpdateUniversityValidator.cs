using FluentValidation;

namespace Planb.Academic.Application.Features.AdminUniversities;

internal sealed class UpdateUniversityValidator : AbstractValidator<UpdateUniversityCommand>
{
    public UpdateUniversityValidator()
    {
        RuleFor(c => c.Name).NotEmpty();
        RuleFor(c => c.Slug).NotEmpty();
    }
}
