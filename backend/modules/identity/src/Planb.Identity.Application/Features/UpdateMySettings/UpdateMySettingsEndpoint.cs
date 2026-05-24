using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Identity.Domain.Users;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Identity.Application.Features.UpdateMySettings;

/// <summary>
/// PATCH /api/users/me/settings (US-072). Acepta un body parcial: cualquier subset de campos.
/// Para Language y Theme parsea el string al enum del dominio acá (no en el validator) para
/// devolver 400 con el catálogo de valores válidos en lugar de un 500 ofuscado del binder.
/// </summary>
public sealed class UpdateMySettingsEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPatch("/api/users/me/settings", async (
            UpdateMySettingsRequest request,
            HttpContext http,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var userId = CurrentUser.RequireUserId(http);

            Language? language = null;
            ThemePreference? theme = null;
            var parseErrors = new Dictionary<string, string[]>();

            if (request.Language is not null)
            {
                if (Enum.TryParse<Language>(request.Language, ignoreCase: false, out var parsed))
                {
                    language = parsed;
                }
                else
                {
                    parseErrors["language"] = [
                        $"Invalid language '{request.Language}'. Valid values: {string.Join(", ", Enum.GetNames<Language>())}.",
                    ];
                }
            }

            if (request.Theme is not null)
            {
                if (Enum.TryParse<ThemePreference>(request.Theme, ignoreCase: false, out var parsed))
                {
                    theme = parsed;
                }
                else
                {
                    parseErrors["theme"] = [
                        $"Invalid theme '{request.Theme}'. Valid values: {string.Join(", ", Enum.GetNames<ThemePreference>())}.",
                    ];
                }
            }

            if (parseErrors.Count > 0)
            {
                return Results.ValidationProblem(parseErrors);
            }

            var command = new UpdateMySettingsCommand(
                userId,
                request.NotificationsInApp,
                request.NotificationsEmail,
                request.NotifyReviewResponse,
                request.NotifyNewReviewInFollowed,
                request.NotifyAcademicCalendar,
                request.NotifyDraftPromotionNudge,
                request.ShowDisplayNameInReviews,
                request.AllowTeacherContact,
                language,
                theme);

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
        .WithName("Identity_UpdateMySettings")
        .WithTags("Identity")
        .RequireAuthorization()
        .Produces(StatusCodes.Status204NoContent)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized);
    }

    private static IResult ToProblem(Error error) => error.Type switch
    {
        ErrorType.Validation => Results.Problem(
            title: error.Code, detail: error.Message,
            statusCode: StatusCodes.Status400BadRequest),
        _ => Results.Problem(
            title: error.Code, detail: error.Message,
            statusCode: StatusCodes.Status500InternalServerError),
    };
}
