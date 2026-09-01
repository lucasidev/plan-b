using Microsoft.EntityFrameworkCore;
using Planb.Reviews.Domain.Curation;

namespace Planb.Reviews.Infrastructure.Persistence.Repositories;

internal sealed class EditorialNoteRepository : IEditorialNoteRepository
{
    private readonly ReviewsDbContext _db;

    public EditorialNoteRepository(ReviewsDbContext db) => _db = db;

    public async Task AddAsync(EditorialNote note, CancellationToken ct = default) =>
        await _db.EditorialNotes.AddAsync(note, ct);

    public Task<EditorialNote?> GetByIdAsync(EditorialNoteId id, CancellationToken ct = default) =>
        _db.EditorialNotes.FirstOrDefaultAsync(n => n.Id == id, ct);
}
