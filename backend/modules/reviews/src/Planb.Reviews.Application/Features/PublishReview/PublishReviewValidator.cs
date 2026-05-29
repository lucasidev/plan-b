using FluentValidation;

namespace Planb.Reviews.Application.Features.PublishReview;

/// <summary>
/// Validaciones fast-fail antes de tocar el dominio: ids no vacíos y rangos básicos. Las
/// invariantes ricas (texto >= 50 chars, "al menos un texto", etc.) las enforca el dominio
/// (VOs + factory) y devuelven errors tipados, no ValidationException.
/// </summary>
internal sealed class PublishReviewValidator : AbstractValidator<PublishReviewCommand>
{
    public PublishReviewValidator()
    {
        RuleFor(c => c.UserId).NotEmpty();
        RuleFor(c => c.EnrollmentId).NotEmpty();
        RuleFor(c => c.DocenteResenadoId).NotEmpty();
        RuleFor(c => c.DifficultyRating).InclusiveBetween(1, 5);

        RuleFor(c => c.FinalGrade!.Value)
            .InclusiveBetween(0m, 10m)
            .When(c => c.FinalGrade is not null);
    }
}
