using FluentValidation;

namespace Planb.Academic.Application.Features.CareerPlanImports;

internal sealed class ApproveCareerPlanImportValidator
    : AbstractValidator<ApproveCareerPlanImportCommand>
{
    public ApproveCareerPlanImportValidator()
    {
        RuleFor(c => c.UserId).NotEmpty();
        RuleFor(c => c.ImportId).NotEmpty();
        RuleFor(c => c.Items).NotEmpty();
        RuleForEach(c => c.Items).SetValidator(new ApproveSubjectItemValidator());
    }
}

internal sealed class ApproveSubjectItemValidator : AbstractValidator<ApproveSubjectItem>
{
    public ApproveSubjectItemValidator()
    {
        // Code y TermKind son opcionales (ADR-0097): solo se valida el largo de Code cuando el
        // item lo trae. TermKind sin parsear a un valor definido queda null, no rechaza el item
        // (mismo criterio que ApproveCareerPlanImportCommandHandler).
        RuleFor(i => i.Code).MaximumLength(40).When(i => i.Code is not null);
        RuleFor(i => i.Name).NotEmpty().MaximumLength(200);
        RuleFor(i => i.YearInPlan).InclusiveBetween(1, 10);
    }
}
