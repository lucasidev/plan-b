using FluentValidation;

namespace Planb.Academic.Application.Features.AdminSubjects;

internal sealed class CreateSubjectValidator : AbstractValidator<CreateSubjectCommand>
{
    public CreateSubjectValidator()
    {
        RuleFor(c => c.Code).NotEmpty();
        RuleFor(c => c.Name).NotEmpty();

        // TermKind ya llega parseado a enum fuerte (el endpoint hace el Enum.TryParse); acá solo
        // quedan los rangos primitivos. El resto (consistencia term_in_year/kind, total >= weekly)
        // lo valida el dominio: son reglas cross-field, no belong acá.
        RuleFor(c => c.YearInPlan).InclusiveBetween(1, 10);
        RuleFor(c => c.WeeklyHours).InclusiveBetween(0, 40);
        RuleFor(c => c.TermInYear!.Value).InclusiveBetween(1, 6).When(c => c.TermInYear is not null);
    }
}
