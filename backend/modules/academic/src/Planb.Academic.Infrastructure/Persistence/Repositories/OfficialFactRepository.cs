using Planb.Academic.Domain.OfficialFacts;

namespace Planb.Academic.Infrastructure.Persistence.Repositories;

internal sealed class OfficialFactRepository : IOfficialFactRepository
{
    private readonly AcademicDbContext _db;
    public OfficialFactRepository(AcademicDbContext db) => _db = db;

    public Task AddAsync(OfficialFact officialFact, CancellationToken ct = default)
    {
        _db.OfficialFacts.Add(officialFact);
        return Task.CompletedTask;
    }
}
