using Planb.Academic.Domain.Universities;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminUniversities;

/// <summary>
/// Handler del GET /api/academic/universities/{id} (admin). Lee el aggregate directo del repo de
/// write (no amerita un reader Dapper aparte: es un lookup por PK sin joins ni cómputo). 404 si no
/// existe.
/// </summary>
public static class GetUniversityQueryHandler
{
    public static async Task<Result<UniversityDetailResponse>> Handle(
        GetUniversityQuery query,
        IUniversityRepository universities,
        CancellationToken ct)
    {
        var university = await universities.FindByIdAsync(
            new UniversityId(query.UniversityId), ct);
        if (university is null)
        {
            return UniversityErrors.NotFound;
        }

        return new UniversityDetailResponse(
            university.Id.Value,
            university.Name,
            university.Slug,
            university.InstitutionalEmailDomains,
            university.IsActive);
    }
}
