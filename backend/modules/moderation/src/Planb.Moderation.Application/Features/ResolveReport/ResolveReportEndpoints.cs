using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Moderation.Application.Features.ReportQueue;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Moderation.Application.Features.ResolveReport;

/// <summary>
/// Endpoints de decisión del moderador sobre un report (US-051), gateados a rol Moderator o Admin:
/// <list type="bullet">
///   <item>POST /api/moderation/reports/{id}/uphold: da lugar (reseña removida + cascade).</item>
///   <item>POST /api/moderation/reports/{id}/dismiss: desestima (reseña se queda; restaura si aplica).</item>
/// </list>
/// Ambos son idempotentes: un report ya resuelto devuelve 409 (otro moderador ganó la race).
/// </summary>
public sealed class ResolveReportEndpoints : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/moderation/reports/{id:guid}/uphold", async (
            Guid id,
            ResolveReportRequest? body,
            HttpContext http,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var moderatorId = CurrentUser.RequireUserId(http);
            var command = new UpholdReportCommand(id, moderatorId.Value, body?.ResolutionNote);
            var result = await bus.InvokeAsync<Result<ResolveReportResponse>>(command, ct);
            return ToResult(result);
        })
        .WithName("Moderation_UpholdReport")
        .WithTags("Moderation")
        .RequireAuthorization(p => p.RequireRole(ModerationPolicy.StaffRoles))
        .Produces<ResolveReportResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);

        app.MapPost("/api/moderation/reports/{id:guid}/dismiss", async (
            Guid id,
            ResolveReportRequest? body,
            HttpContext http,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var moderatorId = CurrentUser.RequireUserId(http);
            var command = new DismissReportCommand(id, moderatorId.Value, body?.ResolutionNote);
            var result = await bus.InvokeAsync<Result<ResolveReportResponse>>(command, ct);
            return ToResult(result);
        })
        .WithName("Moderation_DismissReport")
        .WithTags("Moderation")
        .RequireAuthorization(p => p.RequireRole(ModerationPolicy.StaffRoles))
        .Produces<ResolveReportResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }

    private static IResult ToResult(Result<ResolveReportResponse> result)
    {
        if (result.IsSuccess)
        {
            return Results.Ok(result.Value);
        }

        var error = result.Error;
        var statusCode = error.Type switch
        {
            ErrorType.Validation => StatusCodes.Status400BadRequest,
            ErrorType.NotFound => StatusCodes.Status404NotFound,
            ErrorType.Conflict => StatusCodes.Status409Conflict,
            ErrorType.Forbidden => StatusCodes.Status403Forbidden,
            ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
            _ => StatusCodes.Status500InternalServerError,
        };
        return Results.Problem(title: error.Code, detail: error.Message, statusCode: statusCode);
    }
}
