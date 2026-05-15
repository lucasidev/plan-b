using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Abstractions.Security;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Identity.Application.Features.CreateStudentProfile;

/// <summary>
/// POST /api/me/student-profiles (US-012).
///
/// Auth: JwtBearer middleware. El <c>UserId</c> se deriva del claim <c>sub</c>; el body solo
/// lleva los datos del profile (CareerPlanId + EnrollmentYear). <c>.RequireAuthorization()</c>
/// rechaza con 401 cualquier request sin token válido antes del handler.
/// </summary>
public sealed class CreateStudentProfileEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/me/student-profiles", async (
            CreateStudentProfileRequest body,
            HttpContext http,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var userId = CurrentUser.RequireUserId(http);
            var command = new CreateStudentProfileCommand(
                userId, body.CareerPlanId, body.EnrollmentYear);

            try
            {
                var result = await bus.InvokeAsync<Result<CreateStudentProfileResponse>>(command, ct);
                if (result.IsSuccess)
                {
                    return Results.Created(
                        $"/api/me/student-profiles/{result.Value.Id}", result.Value);
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

                return Results.Problem(
                    title: error.Code,
                    detail: error.Message,
                    statusCode: status);
            }
            catch (ValidationException ex)
            {
                var errors = ex.Errors.GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
                return Results.ValidationProblem(errors);
            }
        })
        .WithName("Identity_CreateStudentProfile")
        .WithTags("Identity")
        .RequireAuthorization()
        .Produces<CreateStudentProfileResponse>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }
}
