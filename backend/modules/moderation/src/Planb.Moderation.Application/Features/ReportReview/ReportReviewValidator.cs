using FluentValidation;

namespace Planb.Moderation.Application.Features.ReportReview;

/// <summary>
/// Fast-fail validation. The richer details-length rule is a domain invariant (returns a
/// typed error mapped to 400); here we only reject obviously malformed shapes.
/// </summary>
internal sealed class ReportReviewValidator : AbstractValidator<ReportReviewCommand>
{
    public ReportReviewValidator()
    {
        RuleFor(c => c.ReviewId).NotEmpty();
        RuleFor(c => c.ReporterUserId).NotEmpty();
    }
}
