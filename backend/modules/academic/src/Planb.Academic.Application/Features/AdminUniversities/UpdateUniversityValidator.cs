using FluentValidation;
using Planb.Academic.Domain.Universities;

namespace Planb.Academic.Application.Features.AdminUniversities;

internal sealed class UpdateUniversityValidator : AbstractValidator<UpdateUniversityCommand>
{
    public UpdateUniversityValidator()
    {
        RuleFor(c => c.Name).NotEmpty().MaximumLength(University.MaxNameLength);
        RuleFor(c => c.Slug).NotEmpty().MaximumLength(University.MaxSlugLength);
    }
}
