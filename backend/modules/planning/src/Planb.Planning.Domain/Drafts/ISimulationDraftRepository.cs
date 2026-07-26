namespace Planb.Planning.Domain.Drafts;

/// <summary>
/// Repositorio de escritura de <see cref="SimulationDraft"/> (US-023). Vive en Domain, no en
/// Application/Abstractions/Persistence: mismo criterio que ICommissionRepository en Academic (el
/// aggregate es dueño del contrato de su propia persistencia). La implementación EF vive en
/// Infrastructure.
/// </summary>
public interface ISimulationDraftRepository
{
    Task AddAsync(SimulationDraft draft, CancellationToken ct = default);

    Task<SimulationDraft?> FindByIdAsync(SimulationDraftId id, CancellationToken ct = default);

    /// <summary>
    /// El borrador <see cref="SimulationDraftStatus.Active"/> del owner para ese término, si existe.
    /// Lo usa el promote (US-023) para archivarlo antes de activar el nuevo: a lo sumo un Active por
    /// (owner, term).
    /// </summary>
    Task<SimulationDraft?> FindActiveForTermAsync(
        Guid ownerProfileId, Guid termId, CancellationToken ct = default);

    /// <summary>Hard delete (US-023): los borradores son efímeros, no hay soft delete.</summary>
    void Remove(SimulationDraft draft);
}
