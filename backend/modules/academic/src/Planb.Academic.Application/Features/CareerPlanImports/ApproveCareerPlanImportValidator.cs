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
        RuleFor(i => i.Code).NotEmpty().MaximumLength(40);
        RuleFor(i => i.Name).NotEmpty().MaximumLength(200);
        RuleFor(i => i.YearInPlan).InclusiveBetween(1, 10);
        RuleFor(i => i.TermKind).NotEmpty();
    }
}
