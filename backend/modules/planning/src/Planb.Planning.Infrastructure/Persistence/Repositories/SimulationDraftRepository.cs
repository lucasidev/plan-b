using Microsoft.EntityFrameworkCore;
using Planb.Planning.Domain.Drafts;

namespace Planb.Planning.Infrastructure.Persistence.Repositories;

internal sealed class SimulationDraftRepository : ISimulationDraftRepository
{
    private readonly PlanningDbContext _db;

    public SimulationDraftRepository(PlanningDbContext db) => _db = db;

    public Task AddAsync(SimulationDraft draft, CancellationToken ct = default)
    {
        _db.SimulationDrafts.Add(draft);
        return Task.CompletedTask;
    }

    public Task<SimulationDraft?> FindByIdAsync(SimulationDraftId id, CancellationToken ct = default) =>
        _db.SimulationDrafts.FirstOrDefaultAsync(d => d.Id == id, ct);

    public Task<SimulationDraft?> FindActiveForTermAsync(
        Guid ownerProfileId, Guid termId, CancellationToken ct = default) =>
        _db.SimulationDrafts.FirstOrDefaultAsync(
            d => d.OwnerProfileId == ownerProfileId
                && d.TermId == termId
                && d.Status == SimulationDraftStatus.Active,
            ct);

    public void Remove(SimulationDraft draft) => _db.SimulationDrafts.Remove(draft);
}
