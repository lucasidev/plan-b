using Planb.Academic.Domain.Careers;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminCareers;

/// <summary>
/// Handler del GET /api/academic/careers/{id} (admin). Lee el aggregate directo del repo de
/// write (no amerita un reader Dapper aparte: es un lookup por PK sin joins ni cómputo). 404 si no
/// existe.
/// </summary>
public static class GetCareerQueryHandler
{
    public static async Task<Result<CareerDetailResponse>> Handle(
        GetCareerQuery query,
        ICareerRepository careers,
        CancellationToken ct)
    {
        var career = await careers.FindByIdAsync(new CareerId(query.CareerId), ct);
        if (career is null)
        {
            return CareerErrors.NotFound;
        }

        return new CareerDetailResponse(
            career.Id.Value,
            career.UniversityId.Value,
            career.Name,
            career.Slug,
            career.ShortName,
            career.Code,
            career.DegreeType?.ToString(),
            career.DurationYears,
            career.Cadence?.ToString(),
            career.Description,
            career.IsOfficial,
            career.IsActive);
    }
}
