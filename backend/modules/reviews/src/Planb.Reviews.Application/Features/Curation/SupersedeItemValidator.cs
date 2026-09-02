using FluentValidation;
using Planb.Reviews.Domain.Catalog;

namespace Planb.Reviews.Application.Features.Curation;

internal sealed class SupersedeItemValidator : AbstractValidator<SupersedeItemCommand>
{
    public SupersedeItemValidator()
    {
        RuleFor(c => c.Code).NotEmpty().MaximumLength(Item.MaxCodeLength);
        RuleFor(c => c.Text).NotEmpty().MaximumLength(Item.MaxTextLength);
        RuleFor(c => c.Help).MaximumLength(Item.MaxHelpLength);

        RuleFor(c => c.Options).NotEmpty().Must(o => o.Count >= Item.MinOptions)
            .WithMessage($"An item needs at least {Item.MinOptions} options.");
    }
}
