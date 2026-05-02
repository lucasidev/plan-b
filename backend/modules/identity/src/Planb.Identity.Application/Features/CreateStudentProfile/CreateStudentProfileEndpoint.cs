using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Domain.Users;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Identity.Application.Features.CreateStudentProfile;

/// <summary>
/// POST /api/me/student-profiles (US-012).
///
/// **Auth gap (NO production-safe)**: este endpoint recibe el <c>UserId</c> en el body porque
/// el backend no tiene JwtBearer middleware configurado todavía. Un atacante puede pasar
/// cualquier UserId. Mitigación operativa: el endpoint solo es alcanzable vía la UI del
/// frontend que extrae el UserId del cookie de sesión firmada.
///
/// Cuando JwtBearer middleware esté disponible, refactorear:
/// <list type="number">
///   <item>Reemplazar UserId del body por extracción del claim <c>sub</c> del JWT.</item>
///   <item>Aplicar <c>.RequireAuthorization()</c> con role policy "member".</item>
///   <item>Cambiar el body a <see cref="CreateStudentProfileRequest"/> sin UserId.</item>
/// </list>
/// </summary>
public sealed class CreateStudentProfileEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/me/student-profiles", async (
            CreateStudentProfileRequestWithUser body,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            UserId userId;
            try
            {
                userId = new UserId(body.UserId);
            }
            catch (ArgumentException)
            {
                return Results.Problem(
                    title: "identity.user.invalid_id",
                    detail: "UserId is invalid.",
                    statusCode: StatusCodes.Status400BadRequest);
            }

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
        .Produces<CreateStudentProfileResponse>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }
}

/// <summary>
/// HTTP body con UserId explícito. Variante usada mientras no haya JwtBearer middleware en
/// el backend. Una vez disponible, este record se elimina y el endpoint pasa a usar
/// <see cref="CreateStudentProfileRequest"/> derivando el UserId del claim <c>sub</c>.
/// </summary>
public sealed record CreateStudentProfileRequestWithUser(
    Guid UserId,
    Guid CareerPlanId,
    int EnrollmentYear);
