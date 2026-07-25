using FluentValidation;

namespace Planb.Academic.Application.Features.AdminCommissions;

internal sealed class CreateCommissionValidator : AbstractValidator<CreateCommissionCommand>
{
    public CreateCommissionValidator()
    {
        RuleFor(c => c.SubjectId).NotEmpty();
        RuleFor(c => c.TermId).NotEmpty();
        RuleFor(c => c.Name).NotEmpty();

        // Modality ya llega parseada a enum fuerte (el endpoint hace el Enum.TryParse); acá solo
        // queda el rango primitivo de Capacity. El resto (unicidad, coherencia cross-aggregate) lo
        // valida el handler: son reglas que necesitan I/O, no belong acá.
        RuleFor(c => c.Capacity!.Value).GreaterThan(0).When(c => c.Capacity is not null);
    }
}
