using FluentValidation;

namespace Planb.Academic.Application.Features.AdminUniversities;

internal sealed class CreateUniversityValidator : AbstractValidator<CreateUniversityCommand>
{
    public CreateUniversityValidator()
    {
        RuleFor(c => c.Name).NotEmpty();
        RuleFor(c => c.Slug).NotEmpty();
    }
}
