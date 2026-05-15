using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Abstractions.Reading;
using Planb.Identity.Application.Abstractions.Security;

namespace Planb.Identity.Application.Features.GetStudentProfile;

/// <summary>
/// GET /api/me/student-profile (US-037 onboarding guard "user tiene profile").
///
/// Auth: JwtBearer middleware extrae el <c>sub</c> claim del JWT (cookie planb_session o
/// Authorization Bearer). El handler usa <see cref="CurrentUser.RequireUserId"/>; el
/// <c>.RequireAuthorization()</c> garantiza que ninguna request sin token válido llegue acá.
///
/// Devuelve 200 con el profile, o 404 si el user no tiene profile aún. El 404 es la señal
/// que el frontend usa para redirigir a /onboarding/welcome desde el guard del layout (member).
/// </summary>
public sealed class GetStudentProfileEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/me/student-profile", async (
            HttpContext http,
            IIdentityReadService reads,
            CancellationToken ct) =>
        {
            var userId = CurrentUser.RequireUserId(http);

            var profile = await reads.GetStudentProfileByUserIdAsync(userId, ct);
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
        .RequireAuthorization()
        .Produces<StudentProfileResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
