using FluentValidation;

namespace Planb.Academic.Application.Features.AdminUniversities;

internal sealed class UpdateUniversityProfileValidator : AbstractValidator<UpdateUniversityProfileCommand>
{
    public UpdateUniversityProfileValidator()
    {
        RuleFor(x => x.WebsiteUrl).MaximumLength(500);
        RuleFor(x => x.Address).MaximumLength(300);
        RuleFor(x => x.Province).MaximumLength(100);
        RuleFor(x => x.LocalityText).MaximumLength(80);
        RuleFor(x => x)
            .Must(x => string.IsNullOrWhiteSpace(x.Province) == string.IsNullOrWhiteSpace(x.LocalityText))
            .WithMessage("Province and locality must be provided or cleared together.");
    }
}
