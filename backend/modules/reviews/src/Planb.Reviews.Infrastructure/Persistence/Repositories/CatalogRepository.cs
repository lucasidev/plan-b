using Microsoft.EntityFrameworkCore;
using Planb.Reviews.Domain.Catalog;

namespace Planb.Reviews.Infrastructure.Persistence.Repositories;

internal sealed class CatalogRepository : ICatalogRepository
{
    private readonly ReviewsDbContext _db;

    public CatalogRepository(ReviewsDbContext db) => _db = db;

    public Task AddItemAsync(Item item, CancellationToken ct = default)
    {
        _db.Items.Add(item);
        return Task.CompletedTask;
    }

    public Task<Item?> GetItemByIdAsync(ItemId id, CancellationToken ct = default) =>
        _db.Items.FirstOrDefaultAsync(i => i.Id == id, ct);

    public Task<Item?> GetItemByCodeAsync(string code, CancellationToken ct = default)
    {
        var normalized = NormalizeCode(code);
        return _db.Items.FirstOrDefaultAsync(i => i.Code == normalized, ct);
    }

    public Task<bool> ItemCodeExistsAsync(string code, ItemId? excludeId, CancellationToken ct = default)
    {
        var normalized = NormalizeCode(code);
        var query = _db.Items.Where(i => i.Code == normalized);
        if (excludeId is { } id)
        {
            query = query.Where(i => i.Id != id);
        }
        return query.AnyAsync(ct);
    }

    public async Task<IReadOnlyList<Item>> GetItemsByIdsAsync(
        IReadOnlyCollection<ItemId> ids, CancellationToken ct = default) =>
        await _db.Items.Where(i => ids.Contains(i.Id)).ToListAsync(ct);

    /// <summary>
    /// Los valores de opción de este ítem que ya tienen respuestas guardadas, leyendo
    /// course_review_answers (la tabla hija de <c>CourseReview.Answers</c>, US-146). SelectMany sobre
    /// el owned collection traduce a un query sobre esa tabla, sin traer la reseña entera a memoria.
    /// </summary>
    public async Task<IReadOnlySet<short>> GetAnsweredOptionValuesAsync(
        ItemId itemId, CancellationToken ct = default)
    {
        var values = await _db.CourseReviews
            .SelectMany(r => r.Answers)
            .Where(a => a.ItemId == itemId)
            .Select(a => a.OptionValue)
            .Distinct()
            .ToListAsync(ct);
        return values.ToHashSet();
    }

    public Task AddInstrumentAsync(Instrument instrument, CancellationToken ct = default)
    {
        _db.Instruments.Add(instrument);
        return Task.CompletedTask;
    }

    /// <summary>La vigente es la que tiene <c>ValidUntil</c> null para ese código (ver Instrument.IsCurrent).</summary>
    public Task<Instrument?> GetCurrentInstrumentAsync(string code, CancellationToken ct = default)
    {
        var normalized = NormalizeCode(code);
        return _db.Instruments.FirstOrDefaultAsync(
            i => i.Code == normalized && i.ValidUntil == null, ct);
    }

    public Task<Instrument?> GetInstrumentByIdAsync(
        InstrumentId id, CancellationToken ct = default) =>
        _db.Instruments.FirstOrDefaultAsync(i => i.Id == id, ct);

    // Mismo criterio de normalización que Item.Create / Instrument.Create: trim + mayúsculas. Sin
    // esto, un lookup con distinta capitalización que la persistida no encontraría la fila.
    private static string NormalizeCode(string code) => code.Trim().ToUpperInvariant();
}
