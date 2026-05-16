using FluentValidation;
using Planb.Academic.Domain.CareerPlanImports;

namespace Planb.Academic.Application.Features.CareerPlanImports;

internal sealed class CreateCareerPlanImportValidator
    : AbstractValidator<CreateCareerPlanImportCommand>
{
    public CreateCareerPlanImportValidator()
    {
        RuleFor(c => c.UserId).NotEmpty();
        RuleFor(c => c.UniversityId).NotEmpty();
        RuleFor(c => c.CareerName).NotEmpty().MaximumLength(200);
        RuleFor(c => c.PlanYear).InclusiveBetween(1990, DateTime.UtcNow.Year);
        RuleFor(c => c.StudentEnrollmentYear).InclusiveBetween(1990, DateTime.UtcNow.Year + 1);

        RuleFor(c => c.PdfBytes)
            .NotNull()
            .When(c => c.SourceType == CareerPlanImportSourceType.Pdf)
            .WithMessage("PdfBytes es requerido cuando SourceType=Pdf.");

        RuleFor(c => c.RawText)
            .NotEmpty()
            .When(c => c.SourceType == CareerPlanImportSourceType.Text)
            .WithMessage("RawText es requerido cuando SourceType=Text.");
    }
}
