using FluentValidation;

namespace Planb.Planning.Application.Features.UpdateSimulationDraft;

internal sealed class UpdateSimulationDraftValidator : AbstractValidator<UpdateSimulationDraftCommand>
{
    public UpdateSimulationDraftValidator()
    {
        RuleFor(c => c.UserId).NotEmpty();
        RuleFor(c => c.DraftId).NotEmpty();
        RuleFor(c => c.Items).NotEmpty();
    }
}
