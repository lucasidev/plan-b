using FluentValidation;
using Planb.Academic.Domain.Subjects;

namespace Planb.Academic.Application.Features.AdminSubjects;

internal sealed class CreateSubjectValidator : AbstractValidator<CreateSubjectCommand>
{
    public CreateSubjectValidator()
    {
        // Code es opcional: solo se valida el largo cuando el caller lo manda.
        RuleFor(c => c.Code).MaximumLength(Subject.MaxCodeLength).When(c => c.Code is not null);
        RuleFor(c => c.Name).NotEmpty().MaximumLength(Subject.MaxNameLength);

        // TermKind ya llega parseado a enum fuerte (el endpoint hace el Enum.TryParse); acá solo
        // quedan los rangos primitivos, y solo cuando el dato está. El resto (consistencia
        // term_in_year/kind, total >= weekly) lo valida el dominio: son reglas cross-field, no
        // belong acá.
        RuleFor(c => c.YearInPlan).InclusiveBetween(1, 10);
        RuleFor(c => c.WeeklyHours!.Value).InclusiveBetween(0, 40).When(c => c.WeeklyHours is not null);
        RuleFor(c => c.TermInYear!.Value).InclusiveBetween(1, 6).When(c => c.TermInYear is not null);
    }
}
