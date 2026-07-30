using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Identity.Application.Contracts;

namespace Planb.Enrollments.Application.Features.GetMyTranscript;

/// <summary>
/// GET /api/me/enrollment-records (US-045-e: la pantalla de historial dejaba de estar siempre
/// vacía). Comparte ruta con el POST de RegisterEnrollment (mismo recurso, verbos distintos).
///
/// Auth: JwtBearer extrae el UserId. Resolvemos el StudentProfileId activo del user via
/// IIdentityQueryService; si el user no tiene profile (todavía no completó onboarding) o no está
/// activo, devolvemos una lista vacía en lugar de 404. Mismo criterio que
/// GetMyPendingReviewsEndpoint en Reviews: cualquier user autenticado obtiene un payload válido
/// aunque vacío, y el frontend no tiene que branchear por error.
///
/// El agrupado por período lo arma <see cref="IMyTranscriptReader"/> con un Dapper raw
/// cross-schema (ver doc en la interface y en la implementación).
/// </summary>
public sealed class GetMyTranscriptEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/me/enrollment-records", async (
            HttpContext http,
            IIdentityQueryService identity,
            IMyTranscriptReader reader,
            CancellationToken ct) =>
        {
            var userId = CurrentUser.RequireUserId(http);

            var profile = await identity.GetStudentProfileForUserAsync(userId.Value, ct);
            if (profile is null || !profile.IsActive)
            {
                return Results.Ok(new GetMyTranscriptResponse([]));
            }

            var periods = await reader.GetForStudentAsync(profile.Id, ct);
            return Results.Ok(new GetMyTranscriptResponse(periods));
        })
        .WithName("Enrollments_GetMyTranscript")
        .WithTags("Enrollments")
        .RequireAuthorization()
        .Produces<GetMyTranscriptResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized);
    }
}
