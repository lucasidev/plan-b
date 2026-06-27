using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Abstractions.Reading;
using Planb.Identity.Application.Abstractions.Security;

namespace Planb.Identity.Application.Features.GetMyTeacherClaims;

/// <summary>
/// GET /api/me/teacher-claims (US-030). Lista los claims docentes del user autenticado, cada uno
/// con el docente reclamado (nombre + título) y su estado de verificación. Read directo (Dapper),
/// sin pasar por command/handler: es una proyección plana (ADR-0018).
/// </summary>
public sealed class GetMyTeacherClaimsEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/me/teacher-claims", async (
            HttpContext http,
            IIdentityReadService reads,
            CancellationToken ct) =>
        {
            var userId = CurrentUser.RequireUserId(http);
            var claims = await reads.GetTeacherClaimsByUserAsync(userId, ct);
            return Results.Ok(claims);
        })
        .WithName("Identity_GetMyTeacherClaims")
        .WithTags("Identity")
        .RequireAuthorization()
        .Produces<IReadOnlyList<TeacherClaimItem>>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized);
    }
}
