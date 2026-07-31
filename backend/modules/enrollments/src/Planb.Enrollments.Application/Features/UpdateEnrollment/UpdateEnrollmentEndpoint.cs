using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Enrollments.Domain.EnrollmentRecords;
using Planb.Identity.Application.Abstractions.Security;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Enrollments.Application.Features.UpdateEnrollment;

/// <summary>
/// PATCH /api/me/enrollment-records/{id} (US-015).
///
/// <para>
/// Es PATCH y no PUT porque el recurso se modifica parcialmente: el alumno y la materia de la
/// cursada no se pueden tocar. Los campos que sí son editables viajan completos; el porqué está en
/// <see cref="UpdateEnrollmentCommand"/>.
/// </para>
///
/// <para>
/// Auth: JwtBearer middleware extrae el <c>UserId</c> del claim <c>sub</c>. La pertenencia del
/// record al alumno la chequea el handler, y responde 404 (no 403) cuando el record es de otro.
/// </para>
/// </summary>
public sealed class UpdateEnrollmentEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPatch("/api/me/enrollment-records/{id:guid}", async (
            Guid id,
            UpdateEnrollmentRequest body,
            HttpContext http,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var userId = CurrentUser.RequireUserId(http);

            // Mismo parseo estricto que el alta: Enum.TryParse acepta strings numéricos, así que
            // sin el IsDefined de StrictEnum un "9" se persistiría como la string "9", fuera del
            // enum, y los CHECK de la tabla no lo atajan porque están escritos como implicaciones.
            if (!StrictEnum.TryParse<EnrollmentStatus>(body.Status, out var status))
            {
                return Results.Problem(
                    title: "enrollments.record.invalid_status",
                    detail: $"Status '{body.Status}' is not a valid EnrollmentStatus.",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            ApprovalMethod? method = null;
            if (!string.IsNullOrWhiteSpace(body.ApprovalMethod))
            {
                if (!StrictEnum.TryParse<ApprovalMethod>(body.ApprovalMethod, out var parsed))
                {
                    return Results.Problem(
                        title: "enrollments.record.invalid_approval_method",
                        detail: $"ApprovalMethod '{body.ApprovalMethod}' is not valid.",
                        statusCode: StatusCodes.Status400BadRequest);
                }
                method = parsed;
            }

            var command = new UpdateEnrollmentCommand(
                userId.Value,
                id,
                body.CommissionId,
                body.TermId,
                status,
                method,
                body.Grade);

            try
            {
                var result = await bus.InvokeAsync<Result<UpdateEnrollmentResponse>>(command, ct);
                if (result.IsSuccess)
                {
                    return Results.Ok(result.Value);
                }

                var error = result.Error;
                var statusCode = error.Type switch
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
                    statusCode: statusCode);
            }
            catch (ValidationException ex)
            {
                var errors = ex.Errors.GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
                return Results.ValidationProblem(errors);
            }
        })
        .WithName("Enrollments_UpdateEnrollment")
        .WithTags("Enrollments")
        .RequireAuthorization()
        .Produces<UpdateEnrollmentResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
