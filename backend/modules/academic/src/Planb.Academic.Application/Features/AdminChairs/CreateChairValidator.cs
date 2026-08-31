using FluentValidation;
using Planb.Academic.Domain.Chairs;

namespace Planb.Academic.Application.Features.AdminChairs;

internal sealed class CreateChairValidator : AbstractValidator<CreateChairCommand>
{
    public CreateChairValidator()
    {
        RuleFor(c => c.SubjectId).NotEmpty();
        RuleFor(c => c.Name).NotEmpty().MaximumLength(Chair.MaxNameLength);
    }
}
