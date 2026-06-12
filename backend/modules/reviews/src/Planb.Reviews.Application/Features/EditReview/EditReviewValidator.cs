using FluentValidation;
using Planb.Reviews.Application.Constants;

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

        RuleFor(c => c.OverallRating!.Value)
            .InclusiveBetween(1, 5)
            .When(c => c.OverallRating is not null);

        RuleFor(c => c.HoursPerWeek!.Value)
            .InclusiveBetween(0, 30)
            .When(c => c.HoursPerWeekProvided && c.HoursPerWeek is not null);

        RuleFor(c => c.Tags!)
            .Must(tags => tags.Count <= AllowedTags.MaxPerReview)
            .WithMessage($"At most {AllowedTags.MaxPerReview} tags are allowed.")
            .Must(tags => tags.All(AllowedTags.IsAllowed))
            .WithMessage("One or more tags are not in the allowed set.")
            .When(c => c.Tags is not null);

        RuleFor(c => c.FinalGrade!.Value)
            .InclusiveBetween(0m, 10m)
            .When(c => c.FinalGradeProvided && c.FinalGrade is not null);
    }
}
