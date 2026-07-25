using FluentValidation;

namespace Planb.Academic.Application.Features.AdminCommissions;

internal sealed class UpdateCommissionValidator : AbstractValidator<UpdateCommissionCommand>
{
    public UpdateCommissionValidator()
    {
        RuleFor(c => c.CommissionId).NotEmpty();
        RuleFor(c => c.Name).NotEmpty();
        RuleFor(c => c.Capacity!.Value).GreaterThan(0).When(c => c.Capacity is not null);
    }
}
