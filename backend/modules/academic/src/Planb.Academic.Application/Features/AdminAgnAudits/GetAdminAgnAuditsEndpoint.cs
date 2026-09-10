using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Academic.Application.Features.AdminUniversities;

namespace Planb.Academic.Application.Features.AdminAgnAudits;

/// <summary>
/// GET /api/academic/agn-audits (admin, issue #506). Una fila por institución del catálogo con su
/// estado de auditoría AGN y cuándo se consultó por última vez, sacado de las afirmaciones que ya
/// existen (no hay un registro de "última consulta" aparte). Gateado a rol Admin, mismo criterio que
/// el resto del backoffice de catálogo.
///
/// <para>
/// Query, no Command: sin CommandHandler separado (mismo criterio que
/// <c>GetOfficialFactsForSubjectEndpoint</c>). Compone dos readers (universidades + afirmaciones
/// agn_audit) y <see cref="AdminAgnAuditResponseMapper.Combine"/> los junta.
/// </para>
/// </summary>
public sealed class GetAdminAgnAuditsEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/academic/agn-audits", async (
            IAdminUniversityReader universities,
            IAdminAgnAuditReader agnAudits,
            CancellationToken ct) =>
        {
            var universityRows = await universities.ListAsync(ct);
            var factRows = await agnAudits.ListFactsAsync(ct);
            var items = AdminAgnAuditResponseMapper.Combine(universityRows, factRows);
            return Results.Ok(new GetAdminAgnAuditsResponse(items));
        })
        .WithName("Academic_GetAdminAgnAudits")
        .WithTags("Academic")
        .RequireAuthorization(p => p.RequireRole(AdminAgnAuditPolicy.RoleName))
        .Produces<GetAdminAgnAuditsResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden);
    }
}
