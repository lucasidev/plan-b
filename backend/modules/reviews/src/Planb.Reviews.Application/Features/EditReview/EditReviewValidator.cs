using FluentValidation;

namespace Planb.Reviews.Application.Features.EditReview;

/// <summary>
/// Fast-fail validations for the edit command. The richer invariants (text length range,
/// "at least one text" after the patch is applied, status guard, cooldown) live in the
/// aggregate or the handler; this validator just rejects obvious shape errors so we do
/// not waste a DB round-trip on a malformed request.
/// </summary>
internal sealed class EditReviewValidator : AbstractValidator<EditReviewCommand>
{
    public EditReviewValidator()
    {
        RuleFor(c => c.ReviewId).NotEmpty();
        RuleFor(c => c.UserId).NotEmpty();

        RuleFor(c => c.DifficultyRating!.Value)
            .InclusiveBetween(1, 5)
            .When(c => c.DifficultyRating is not null);

        RuleFor(c => c.FinalGrade!.Value)
            .InclusiveBetween(0m, 10m)
            .When(c => c.FinalGradeProvided && c.FinalGrade is not null);
    }
}
