using FluentValidation;

namespace Planb.Identity.Application.Features.CreateStudentProfile;

internal sealed class CreateStudentProfileValidator : AbstractValidator<CreateStudentProfileCommand>
{
    public CreateStudentProfileValidator()
    {
        RuleFor(c => c.CareerPlanId).NotEmpty();
        // El range exacto del año lo enforza el aggregate (User.AddStudentProfile) contra el clock.
        // Aca solo cazamos valores claramente degenerados (0, negativos, futuros lejanos).
        RuleFor(c => c.EnrollmentYear)
            .GreaterThan(1900)
            .LessThan(3000);
    }
}
