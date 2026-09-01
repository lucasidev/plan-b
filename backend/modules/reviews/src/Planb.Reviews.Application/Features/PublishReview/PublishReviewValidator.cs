using FluentValidation;
using Planb.Reviews.Domain.Reviews;

namespace Planb.Reviews.Application.Features.PublishReview;

/// <summary>
/// Validación de forma del comando (US-146). Lo que se chequea acá es que el mensaje esté bien
/// armado; lo que es regla del producto (que el ítem exista, que la opción le pertenezca, que no
/// haya reseñado ya esa cursada) lo decide el handler contra el catálogo y el aggregate.
/// </summary>
internal sealed class PublishReviewValidator : AbstractValidator<PublishReviewCommand>
{
    public PublishReviewValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.SubjectId).NotEmpty();
        RuleFor(x => x.TermId).NotEmpty();

        // ChairId es opcional (no siempre se recuerda la cátedra), pero si viene no puede ser vacío:
        // un Guid.Empty explícito es un bug del cliente, no un "no sé".
        RuleFor(x => x.ChairId!.Value)
            .NotEmpty()
            .When(x => x.ChairId is not null);

        RuleFor(x => x.Answers)
            .NotNull()
            .Must(a => a is null || a.Count > 0)
            .WithMessage("A review needs at least one answered item.");

        RuleForEach(x => x.Answers).ChildRules(answer =>
        {
            answer.RuleFor(a => a.ItemCode).NotEmpty();
        });

        RuleFor(x => x.FreeText!)
            .MaximumLength(Review.MaxFreeTextLength)
            .When(x => x.FreeText is not null);
    }
}
