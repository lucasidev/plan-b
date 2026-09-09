using FluentValidation;
using Planb.Academic.Domain.OfficialFacts;

namespace Planb.Academic.Application.Features.OfficialFacts;

/// <summary>
/// Reglas de forma (largo, no-blank). Las invariantes de negocio (fuente obligatoria, valor
/// requerido según el estado, regla de un Derived, razón de un NotApplicable) las enforca el
/// aggregate en <see cref="OfficialFact.Create"/>, no este validator.
/// </summary>
internal sealed class CreateOfficialFactValidator : AbstractValidator<CreateOfficialFactCommand>
{
    public CreateOfficialFactValidator()
    {
        RuleFor(c => c.SubjectId).NotEqual(Guid.Empty);
        RuleFor(c => c.Field).NotEmpty().MaximumLength(OfficialFact.MaxFieldLength);
        RuleFor(c => c.Value).MaximumLength(OfficialFact.MaxValueLength).When(c => c.Value is not null);
        RuleFor(c => c.Unit).MaximumLength(OfficialFact.MaxUnitLength).When(c => c.Unit is not null);
        RuleFor(c => c.Period).MaximumLength(OfficialFact.MaxPeriodLength).When(c => c.Period is not null);
        RuleFor(c => c.SourceName).NotEmpty().MaximumLength(OfficialFact.MaxSourceNameLength);
        RuleFor(c => c.SourceUrl).NotEmpty().MaximumLength(OfficialFact.MaxSourceUrlLength);
        RuleFor(c => c.SourceDocument)
            .MaximumLength(OfficialFact.MaxSourceDocumentLength).When(c => c.SourceDocument is not null);
        RuleFor(c => c.SourceRetrievedAt).NotEqual(default(DateTimeOffset));
        RuleFor(c => c.DerivationRuleId)
            .MaximumLength(OfficialFact.MaxDerivationRuleIdLength).When(c => c.DerivationRuleId is not null);
        RuleFor(c => c.Note).MaximumLength(OfficialFact.MaxNoteLength).When(c => c.Note is not null);
        RuleFor(c => c.RelievedAt).NotEqual(default(DateTimeOffset));
        RuleFor(c => c.RelievedBy).NotEqual(Guid.Empty);
    }
}
