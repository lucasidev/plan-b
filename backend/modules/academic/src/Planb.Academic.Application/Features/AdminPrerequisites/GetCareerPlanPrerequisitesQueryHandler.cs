using Planb.Academic.Domain.CareerPlans;
using Planb.Academic.Domain.Prerequisites;

namespace Planb.Academic.Application.Features.AdminPrerequisites;

/// <summary>
/// Handler del GET /api/academic/career-plans/{planId}/prerequisites (admin). Lee el aggregate
/// directo del repo de write (no amerita un reader Dapper aparte: es un lookup por plan sin joins
/// ni cómputo, mismo criterio que GetAcademicTermQueryHandler). Siempre 200: un plan sin
/// correlativas cargadas todavía devuelve items vacío (mismo criterio que
/// ListAcademicTermsAdminEndpoint para un parent sin hijos, sin round-trip extra para validar que
/// el plan exista).
/// </summary>
public static class GetCareerPlanPrerequisitesQueryHandler
{
    public static async Task<PrerequisiteGraphResponse> Handle(
        GetCareerPlanPrerequisitesQuery query,
        IPrerequisiteRepository prerequisites,
        CancellationToken ct)
    {
        var edges = await prerequisites.GetByPlanAsync(new CareerPlanId(query.CareerPlanId), ct);

        var items = edges
            .Select(e => new PrerequisiteEdgeItem(e.SubjectId.Value, e.RequiredSubjectId.Value, e.Type.ToString()))
            .ToList();

        return new PrerequisiteGraphResponse(items);
    }
}
