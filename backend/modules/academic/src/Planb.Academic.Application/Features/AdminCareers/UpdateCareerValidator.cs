using FluentValidation;
using Planb.Academic.Domain.Careers;

namespace Planb.Academic.Application.Features.AdminCareers;

internal sealed class UpdateCareerValidator : AbstractValidator<UpdateCareerCommand>
{
    public UpdateCareerValidator()
    {
        RuleFor(c => c.Name).NotEmpty().MaximumLength(Career.MaxNameLength);
        RuleFor(c => c.Slug).NotEmpty().MaximumLength(Career.MaxSlugLength);
        RuleFor(c => c.ShortName).MaximumLength(Career.MaxShortNameLength).When(c => c.ShortName is not null);
        RuleFor(c => c.Code).MaximumLength(Career.MaxCodeLength).When(c => c.Code is not null);
        RuleFor(c => c.Description).MaximumLength(Career.MaxDescriptionLength).When(c => c.Description is not null);

        // DegreeType/Cadence ya llegan parseados a enum fuerte (el endpoint hace el
        // Enum.TryParse); acá solo queda validar el rango de DurationYears cuando viene.
        RuleFor(c => c.DurationYears!.Value)
            .InclusiveBetween(1, 15)
            .When(c => c.DurationYears is not null);
    }
}
