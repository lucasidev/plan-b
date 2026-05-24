using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Abstractions.Security;
using Wolverine;

namespace Planb.Identity.Application.Features.GetMySettings;

/// <summary>
/// GET /api/users/me/settings (US-072). Devuelve los settings del user logueado, materializando
/// los defaults si todavía no personalizó nada. Siempre 200 (no hay error path natural acá:
/// el user existe porque pasó el JwtBearer middleware, y los settings siempre devuelven algo).
/// </summary>
public sealed class GetMySettingsEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/users/me/settings", async (
            HttpContext http,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var userId = CurrentUser.RequireUserId(http);
            var response = await bus.InvokeAsync<GetMySettingsResponse>(
                new GetMySettingsQuery(userId), ct);
            return Results.Ok(response);
        })
        .WithName("Identity_GetMySettings")
        .WithTags("Identity")
        .RequireAuthorization()
        .Produces<GetMySettingsResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized);
    }
}
