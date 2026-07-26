using FluentValidation;

namespace Planb.Planning.Application.Features.CreateSimulationDraft;

internal sealed class CreateSimulationDraftValidator : AbstractValidator<CreateSimulationDraftCommand>
{
    public CreateSimulationDraftValidator()
    {
        RuleFor(c => c.UserId).NotEmpty();
        RuleFor(c => c.TermId).NotEmpty();
        RuleFor(c => c.Items).NotEmpty();
    }
}
