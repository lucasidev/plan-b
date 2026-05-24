using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Abstractions.Security;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Identity.Application.Features.UpdateMyProfile;

/// <summary>
/// PATCH /api/me/student-profile (US-047). Actualización parcial del perfil del user logueado
/// (display name, año cursando, legajo, regular). El handler delega al aggregate User para
/// validar reglas del dominio y aplicar el patch al StudentProfile activo.
///
/// <para>
/// Mapeo de errores:
/// </para>
/// <list type="bullet">
///   <item><c>identity.account.not_active</c> → 403 (user disabled/expired/deactivated).</item>
///   <item><c>identity.student_profile.not_found</c> → 404 (no hay profile activo).</item>
///   <item><c>identity.student_profile.display_name_invalid</c> → 400.</item>
///   <item><c>identity.student_profile.year_of_study_out_of_range</c> → 400.</item>
///   <item><c>identity.student_profile.legajo_invalid</c> → 400.</item>
/// </list>
/// </summary>
public sealed class UpdateMyProfileEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPatch("/api/me/student-profile", async (
            UpdateMyProfileRequest request,
            HttpContext http,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var userId = CurrentUser.RequireUserId(http);
            var command = new UpdateMyProfileCommand(
                userId,
                request.DisplayName,
                request.YearOfStudy,
                request.Legajo,
                request.RegularStudent);

            try
            {
                var result = await bus.InvokeAsync<Result>(command, ct);
                return result.IsSuccess
                    ? Results.NoContent()
                    : ToProblem(result.Error);
            }
            catch (ValidationException ex)
            {
                var errors = ex.Errors.GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
                return Results.ValidationProblem(errors);
            }
        })
        .WithName("Identity_UpdateMyProfile")
        .WithTags("Identity")
        .RequireAuthorization()
        .Produces(StatusCodes.Status204NoContent)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }

    private static IResult ToProblem(Error error) => error.Type switch
    {
        ErrorType.Validation => Results.Problem(
            title: error.Code, detail: error.Message,
            statusCode: StatusCodes.Status400BadRequest),
        ErrorType.NotFound => Results.Problem(
            title: error.Code, detail: error.Message,
            statusCode: StatusCodes.Status404NotFound),
        ErrorType.Forbidden => Results.Problem(
            title: error.Code, detail: error.Message,
            statusCode: StatusCodes.Status403Forbidden),
        ErrorType.Unauthorized => Results.Problem(
            title: error.Code, detail: error.Message,
            statusCode: StatusCodes.Status401Unauthorized),
        ErrorType.Conflict => Results.Problem(
            title: error.Code, detail: error.Message,
            statusCode: StatusCodes.Status409Conflict),
        _ => Results.Problem(
            title: error.Code, detail: error.Message,
            statusCode: StatusCodes.Status500InternalServerError),
    };
}
