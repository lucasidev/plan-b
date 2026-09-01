using FluentValidation;
using Planb.Reviews.Domain.Catalog;

namespace Planb.Reviews.Application.Features.Curation;

internal sealed class DistilItemValidator : AbstractValidator<DistilItemCommand>
{
    public DistilItemValidator()
    {
        RuleFor(c => c.Code).NotEmpty().MaximumLength(Item.MaxCodeLength);
        RuleFor(c => c.Text).NotEmpty().MaximumLength(Item.MaxTextLength);
        RuleFor(c => c.Help).MaximumLength(Item.MaxHelpLength);

        // El mínimo lo impone el dominio y se repite acá para que un pedido incompleto salga como
        // 400 con su mensaje, en vez de llegar al aggregate y volver como un error de negocio.
        RuleFor(c => c.Options).NotEmpty().Must(o => o.Count >= Item.MinOptions)
            .WithMessage($"An item needs at least {Item.MinOptions} options.");
    }
}
