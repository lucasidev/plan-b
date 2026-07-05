using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Moderation.Application.Features.ReportQueue;

namespace Planb.Moderation.Application.Features.ReportDetail;

/// <summary>
/// GET /api/moderation/reports/{id} (US-051). Detalle del report para la pantalla de decisión.
/// Gateado a rol Moderator o Admin. 404 si el report no existe.
/// </summary>
public sealed class GetReportDetailEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/moderation/reports/{id:guid}", async (
            Guid id,
            IReportDetailReader reader,
            CancellationToken ct) =>
        {
            var detail = await reader.GetAsync(id, ct);
            return detail is null
                ? Results.Problem(
                    title: "moderation.report.not_found",
                    detail: "Report not found.",
                    statusCode: StatusCodes.Status404NotFound)
                : Results.Ok(detail);
        })
        .WithName("Moderation_GetReportDetail")
        .WithTags("Moderation")
        .RequireAuthorization(p => p.RequireRole(ModerationPolicy.StaffRoles))
        .Produces<ReportDetailResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
