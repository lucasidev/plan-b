using FluentValidation;

namespace Planb.Academic.Application.Features.AdminChairs;

internal sealed class CloseChairMemberValidator : AbstractValidator<CloseChairMemberCommand>
{
    public CloseChairMemberValidator()
    {
        RuleFor(c => c.ChairId).NotEmpty();
        RuleFor(c => c.TeacherId).NotEmpty();
        RuleFor(c => c.UntilTermId).NotEmpty();
    }
}
