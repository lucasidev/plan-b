using FluentValidation;

namespace Planb.Enrollments.Application.Features.HistorialImports;

internal sealed class ConfirmHistorialImportValidator : AbstractValidator<ConfirmHistorialImportCommand>
{
    public ConfirmHistorialImportValidator()
    {
        RuleFor(c => c.UserId).NotEmpty();
        RuleFor(c => c.ImportId).NotEmpty();
        RuleFor(c => c.Items).NotEmpty();
        RuleForEach(c => c.Items).SetValidator(new ConfirmedItemValidator());
    }
}

internal sealed class ConfirmedItemValidator : AbstractValidator<ConfirmedItem>
{
    public ConfirmedItemValidator()
    {
        RuleFor(i => i.SubjectId).NotEmpty();
        RuleFor(i => i.Status).NotEmpty();
        RuleFor(i => i.Grade!.Value)
            .InclusiveBetween(0m, 10m)
            .When(i => i.Grade is not null);
    }
}
