using FluentValidation;

namespace Planb.Academic.Application.Features.AdminCareers;

internal sealed class UpdateCareerValidator : AbstractValidator<UpdateCareerCommand>
{
    public UpdateCareerValidator()
    {
        RuleFor(c => c.Name).NotEmpty();
        RuleFor(c => c.Slug).NotEmpty();

        // DegreeType/Cadence ya llegan parseados a enum fuerte (el endpoint hace el
        // Enum.TryParse); acá solo queda validar el rango de DurationYears cuando viene.
        RuleFor(c => c.DurationYears!.Value)
            .InclusiveBetween(1, 15)
            .When(c => c.DurationYears is not null);
    }
}
