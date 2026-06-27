using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Identity.Domain.TeacherProfiles;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Identity.Application.Features.InitiateTeacherClaim;

/// <summary>
/// POST /api/me/teacher-claims (US-030).
///
/// Auth: JwtBearer middleware. El <c>UserId</c> sale del claim <c>sub</c>; el body solo lleva el
/// <c>teacherId</c>. Un docente dado de baja entre el GET (UI) y este POST devuelve 410 Gone (no
/// 404): el recurso existió pero ya no está en el catálogo.
/// </summary>
public sealed class InitiateTeacherClaimEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/me/teacher-claims", async (
            InitiateTeacherClaimRequest body,
            HttpContext http,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var userId = CurrentUser.RequireUserId(http);
            var command = new InitiateTeacherClaimCommand(userId, body.TeacherId);

            try
            {
                var result = await bus.InvokeAsync<Result<InitiateTeacherClaimResponse>>(command, ct);
                if (result.IsSuccess)
                {
                    return Results.Created(
                        $"/api/me/teacher-claims/{result.Value.ClaimId}", result.Value);
                }

                var error = result.Error;

                if (error.Code == TeacherProfileErrors.TeacherRemoved.Code)
                {
                    return Results.Problem(
                        title: error.Code,
                        detail: error.Message,
                        statusCode: StatusCodes.Status410Gone);
                }

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
        .WithName("Identity_InitiateTeacherClaim")
        .WithTags("Identity")
        .RequireAuthorization()
        .Produces<InitiateTeacherClaimResponse>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict)
        .ProducesProblem(StatusCodes.Status410Gone);
    }
}
