using Planb.Identity.Application.Contracts;
using Planb.Planning.Application.Abstractions.Persistence;
using Planb.Planning.Domain.Availability;
using Planb.SharedKernel.Primitives;

namespace Planb.Planning.Application.Features.ListSimulationDrafts;

/// <summary>
/// Handler de US-023 (listar mis borradores). Devuelve todos los estados: el read model resuelve
/// subject code/name y commission name vía Dapper cross-schema (DapperSimulationDraftListReader) para
/// que la lista se pinte sin N+1.
/// </summary>
public static class ListSimulationDraftsQueryHandler
{
    public static async Task<Result<ListSimulationDraftsResponse>> Handle(
        ListSimulationDraftsQuery query,
        IIdentityQueryService identity,
        ISimulationDraftListReader reader,
        CancellationToken ct)
    {
        var profile = await identity.GetStudentProfileForUserAsync(query.UserId, ct);
        if (profile is null || !profile.IsActive)
        {
            return Result.Failure<ListSimulationDraftsResponse>(AvailabilityErrors.StudentProfileRequired);
        }

        var items = await reader.ListByOwnerAsync(profile.Id, ct);
        return new ListSimulationDraftsResponse(items);
    }
}
