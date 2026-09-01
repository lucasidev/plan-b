using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Domain.Curation;

public static class EditorialNoteErrors
{
    public static readonly Error CareerRequired =
        Error.Validation("reviews.editorial_note.career_required", "A note needs a career.");

    public static readonly Error TextRequired =
        Error.Validation("reviews.editorial_note.text_required", "A note needs its text.");

    public static readonly Error TextTooLong =
        Error.Validation(
            "reviews.editorial_note.text_too_long",
            $"A note is at most {EditorialNote.MaxTextLength} characters.");

    public static readonly Error CareerNotFound =
        Error.NotFound("reviews.editorial_note.career_not_found", "That career does not exist.");

    public static readonly Error NotFound =
        Error.NotFound("reviews.editorial_note.not_found", "Editorial note not found.");

    public static readonly Error AlreadyWithdrawn =
        Error.Conflict("reviews.editorial_note.already_withdrawn", "That note is already withdrawn.");
}
