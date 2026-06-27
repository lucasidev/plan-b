using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Abstractions.Security;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Identity.Application.Features.SubmitInstitutionalEmail;

/// <summary>
/// POST /api/me/teacher-claims/{id}/institutional-email (US-031 paso 1).
///
/// Auth: JwtBearer. El owner del claim ingresa su email institucional; si el dominio pertenece a la
/// universidad del docente se le manda un mail con el link de verificación. 202 Accepted: el trabajo
/// (mandar el mail) quedó aceptado. Dominio no permitido → 400 (sugiere verificación manual).
/// </summary>
public sealed class SubmitInstitutionalEmailEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/me/teacher-claims/{id:guid}/institutional-email", async (
            Guid id,
            SubmitInstitutionalEmailRequest body,
            HttpContext http,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var userId = CurrentUser.RequireUserId(http);
            var command = new SubmitInstitutionalEmailCommand(userId, id, body.Email);

            try
            {
                var result = await bus.InvokeAsync<Result>(command, ct);
                if (result.IsSuccess)
                {
                    return Results.Accepted();
                }

                var error = result.Error;
                var status = error.Type switch
                {
                    ErrorType.Validation => StatusCodes.Status400BadRequest,
                    ErrorType.NotFound => StatusCodes.Status404NotFound,
                    ErrorType.Conflict => StatusCodes.Status409Conflict,
                    ErrorType.Forbidden => StatusCodes.Status403Forbidden,
                    ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
                    _ => StatusCodes.Status500InternalServerError,
                };

                return Results.Problem(title: error.Code, detail: error.Message, statusCode: status);
            }
            catch (ValidationException ex)
            {
                var errors = ex.Errors.GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
                return Results.ValidationProblem(errors);
            }
        })
        .WithName("Identity_SubmitInstitutionalEmail")
        .WithTags("Identity")
        .RequireAuthorization()
        .Produces(StatusCodes.Status202Accepted)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }
}
