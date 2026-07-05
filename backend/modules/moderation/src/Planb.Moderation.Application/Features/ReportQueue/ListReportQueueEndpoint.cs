using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Planb.Moderation.Application.Features.ReportQueue;

/// <summary>
/// GET /api/moderation/reports/queue (US-050). Cola de reportes para el moderador: una fila por
/// report abierto (o cerrado con ?status=closed), ordenada por urgencia (tone) y después antigüedad.
/// Gateado a rol Moderator o Admin.
///
/// <para>
/// Query params: <c>?status=open|closed</c> (default open), <c>?tone=urgent|normal|low</c>,
/// <c>?olderThan=N</c> (días), <c>?page=</c> (default 1), <c>?pageSize=</c> (default 20, máx 100).
/// La ruta va bajo <c>/api/moderation/</c> por la convención de módulo del backend (la spec mencionaba
/// <c>/api/admin/</c>, pero el codebase namespacea por módulo: ver AdminTeachers en academic).
/// </para>
/// </summary>
public sealed class ListReportQueueEndpoint : ICarterModule
{
    public const int DefaultPageSize = 20;
    public const int MaxPageSize = 100;
    private static readonly string[] ValidTones = ["urgent", "normal", "low"];

    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/moderation/reports/queue", async (
            string? status,
            string? tone,
            int? olderThan,
            int? page,
            int? pageSize,
            IReportQueueReader reader,
            CancellationToken ct) =>
        {
            var openOnly = !string.Equals(status, "closed", StringComparison.OrdinalIgnoreCase);

            var normalizedTone = string.IsNullOrWhiteSpace(tone)
                ? null
                : tone.Trim().ToLowerInvariant();
            if (normalizedTone is not null && !ValidTones.Contains(normalizedTone))
            {
                return Results.Problem(
                    title: "moderation.queue.invalid_tone",
                    detail: "tone debe ser urgent, normal o low.",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            var pageNum = Math.Max(1, page ?? 1);
            var size = Math.Clamp(pageSize ?? DefaultPageSize, 1, MaxPageSize);
            var olderThanDays = olderThan is > 0 ? olderThan : null;

            var filter = new ReportQueueFilter(openOnly, normalizedTone, olderThanDays, pageNum, size);
            var result = await reader.ReadAsync(filter, ct);

            return Results.Ok(new ReportQueueResponse(
                result.Counts, result.Items, pageNum, size, result.TotalCount));
        })
        .WithName("Moderation_ListReportQueue")
        .WithTags("Moderation")
        .RequireAuthorization(p => p.RequireRole(ModerationPolicy.StaffRoles))
        .Produces<ReportQueueResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden);
    }
}
