using Planb.Academic.Domain.AcademicTerms;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminAcademicTerms;

/// <summary>
/// Handler del GET /api/academic/academic-terms/{id} (admin). Lee el aggregate directo del repo de
/// write (no amerita un reader Dapper aparte: es un lookup por PK sin joins ni cómputo). 404 si no
/// existe.
/// </summary>
public static class GetAcademicTermQueryHandler
{
    public static async Task<Result<AcademicTermDetailResponse>> Handle(
        GetAcademicTermQuery query,
        IAcademicTermRepository terms,
        CancellationToken ct)
    {
        var term = await terms.FindByIdAsync(new AcademicTermId(query.AcademicTermId), ct);
        if (term is null)
        {
            return AcademicTermErrors.NotFound;
        }

        return new AcademicTermDetailResponse(
            term.Id.Value,
            term.UniversityId.Value,
            term.Year,
            term.Number,
            term.Kind.ToString(),
            term.StartDate,
            term.EndDate,
            term.EnrollmentOpens,
            term.EnrollmentCloses,
            term.Label,
            term.CreatedAt);
    }
}
