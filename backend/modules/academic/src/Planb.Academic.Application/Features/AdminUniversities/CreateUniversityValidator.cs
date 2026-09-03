using FluentValidation;
using Planb.Academic.Domain.Universities;

namespace Planb.Academic.Application.Features.AdminUniversities;

internal sealed class CreateUniversityValidator : AbstractValidator<CreateUniversityCommand>
{
    public CreateUniversityValidator()
    {
        RuleFor(c => c.Name).NotEmpty().MaximumLength(University.MaxNameLength);
        RuleFor(c => c.Slug).NotEmpty().MaximumLength(University.MaxSlugLength);
    }
}
