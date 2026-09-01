using FluentValidation;
using Planb.Reviews.Domain.Curation;

namespace Planb.Reviews.Application.Features.Curation;

internal sealed class PublishEditorialNoteValidator : AbstractValidator<PublishEditorialNoteCommand>
{
    public PublishEditorialNoteValidator()
    {
        RuleFor(c => c.CareerId).NotEmpty();
        RuleFor(c => c.Text).NotEmpty().MaximumLength(EditorialNote.MaxTextLength);
    }
}
