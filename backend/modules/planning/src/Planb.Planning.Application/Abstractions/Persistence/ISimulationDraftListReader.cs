using Planb.Planning.Application.Features.ListSimulationDrafts;

namespace Planb.Planning.Application.Abstractions.Persistence;

/// <summary>
/// Read-side de US-023 (listar mis borradores). Cross-schema (Dapper, en Infrastructure): resuelve
/// code/name de cada materia y name de cada comisión elegida sin que el frontend tenga que pedirlos
/// aparte (evita N+1), mismo criterio que ISimulatorAvailabilityReader.
/// </summary>
public interface ISimulationDraftListReader
{
    Task<IReadOnlyList<SimulationDraftListItem>> ListByOwnerAsync(
        Guid ownerProfileId, CancellationToken ct = default);
}
