using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Abstractions.Reading;
using Planb.Identity.Domain.Users;

namespace Planb.Identity.Application.Features.GetStudentProfile;

/// <summary>
/// GET /api/me/student-profiles?userId={id} (US-037 onboarding guard "user tiene profile").
///
/// **Auth gap (NO production-safe)**: este endpoint recibe el <c>UserId</c> en query param
/// porque el backend no tiene JwtBearer middleware configurado todavía. Mismo gap que
/// <see cref="CreateStudentProfile.CreateStudentProfileEndpoint"/> (US-012-b). Mitigación
/// operativa: el endpoint es alcanzable solo vía la UI del frontend, que extrae el UserId
/// del cookie de sesión firmada server-side antes de llamar.
///
/// Cuando JwtBearer middleware esté disponible:
/// <list type="number">
///   <item>Reemplazar <c>userId</c> del query por extracción del claim <c>sub</c> del JWT.</item>
///   <item>Aplicar <c>.RequireAuthorization()</c> con role policy "member".</item>
///   <item>Cambiar la URL a <c>GET /api/me/student-profile</c> (singular, sin query param).</item>
/// </list>
///
/// Devuelve 200 con el profile, o 404 si el user no tiene profile aún. El 404 es la señal
/// que el frontend usa para redirigir a /onboarding/welcome desde el guard del layout (member).
/// </summary>
public sealed class GetStudentProfileEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/me/student-profiles", async (
            Guid? userId,
            IIdentityReadService reads,
            CancellationToken ct) =>
        {
            if (userId is null || userId == Guid.Empty)
            {
                return Results.Problem(
                    title: "identity.student_profile.missing_user_id",
                    detail: "userId query parameter is required.",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            var profile = await reads.GetStudentProfileByUserIdAsync(new UserId(userId.Value), ct);
            if (profile is null)
            {
                return Results.Problem(
                    title: "identity.student_profile.not_found",
                    detail: "The user has no student profile yet.",
                    statusCode: StatusCodes.Status404NotFound);
            }

            return Results.Ok(profile);
        })
        .WithName("Identity_GetStudentProfile")
        .WithTags("Identity")
        .Produces<StudentProfileResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
