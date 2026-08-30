using FluentValidation;

namespace Planb.Identity.Application.Features.CreateStudentProfile;

internal sealed class CreateStudentProfileValidator : AbstractValidator<CreateStudentProfileCommand>
{
    public CreateStudentProfileValidator()
    {
        RuleFor(c => c.CareerPlanId).NotEmpty();
        // El range exacto del año lo enforza el aggregate (User.AddStudentProfile) contra el clock.
        // Aca solo cazamos valores claramente degenerados (0, negativos, futuros lejanos), y solo
        // cuando el año viene: es opcional (mudanza de la declaración de carrera al registro, donde
        // el profile puede nacer sin año).
        RuleFor(c => c.EnrollmentYear)
            .GreaterThan(1900)
            .LessThan(3000)
            .When(c => c.EnrollmentYear.HasValue);
    }
}
