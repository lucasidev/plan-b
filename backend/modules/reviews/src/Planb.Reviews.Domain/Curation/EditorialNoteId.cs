namespace Planb.Reviews.Domain.Curation;

public readonly record struct EditorialNoteId(Guid Value)
{
    public static EditorialNoteId New() => new(Guid.CreateVersion7());
}
