using FluentValidation;

namespace Planb.Academic.Application.Features.AdminAcademicTerms;

internal sealed class CreateAcademicTermValidator : AbstractValidator<CreateAcademicTermCommand>
{
    public CreateAcademicTermValidator()
    {
        // Kind ya llega parseado a enum fuerte (el endpoint hace el Enum.TryParse); acá solo
        // quedan los rangos primitivos de year/number. El resto (fechas, anual+number) lo valida
        // el dominio: son reglas cross-field, no belong acá.
        RuleFor(c => c.Year).GreaterThan(0);
        RuleFor(c => c.Number).InclusiveBetween(1, 6);
    }
}
