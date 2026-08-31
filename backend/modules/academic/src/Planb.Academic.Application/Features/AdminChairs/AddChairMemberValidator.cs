using FluentValidation;

namespace Planb.Academic.Application.Features.AdminChairs;

internal sealed class AddChairMemberValidator : AbstractValidator<AddChairMemberCommand>
{
    public AddChairMemberValidator()
    {
        RuleFor(c => c.ChairId).NotEmpty();
        RuleFor(c => c.TeacherId).NotEmpty();
        RuleFor(c => c.SinceTermId).NotEmpty();
        RuleFor(c => c.Role).IsInEnum();
    }
}
