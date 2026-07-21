using FluentValidation;

namespace Planb.Planning.Application.Features.EvaluateSimulation;

internal sealed class EvaluateSimulationValidator : AbstractValidator<EvaluateSimulationCommand>
{
    public EvaluateSimulationValidator()
    {
        RuleFor(c => c.UserId).NotEmpty();
        RuleFor(c => c.SubjectIds).NotEmpty();
        RuleForEach(c => c.SubjectIds).NotEmpty();
    }
}
