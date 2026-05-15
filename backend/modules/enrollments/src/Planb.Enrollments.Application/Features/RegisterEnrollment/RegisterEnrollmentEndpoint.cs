using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Enrollments.Domain.EnrollmentRecords;
using Planb.Identity.Application.Abstractions.Security;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Enrollments.Application.Features.RegisterEnrollment;

/// <summary>
/// POST /api/me/enrollment-records (US-013).
///
/// Auth: JwtBearer middleware extrae el <c>UserId</c> del claim <c>sub</c>; el body solo
/// lleva los datos del enrollment. <c>.RequireAuthorization()</c> rechaza con 401 cualquier
/// request sin token válido antes del handler.
/// </summary>
public sealed class RegisterEnrollmentEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/me/enrollment-records", async (
            RegisterEnrollmentRequest body,
            HttpContext http,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var userId = CurrentUser.RequireUserId(http);

            // Parse de los enums string → enum. Si el string no matchea, devolvemos 400 con
            // mensaje claro (mejor que ValidationException genérica de FluentValidation).
            if (!Enum.TryParse<EnrollmentStatus>(body.Status, ignoreCase: true, out var status))
            {
                return Results.Problem(
                    title: "enrollments.record.invalid_status",
                    detail: $"Status '{body.Status}' is not a valid EnrollmentStatus.",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            ApprovalMethod? method = null;
            if (!string.IsNullOrWhiteSpace(body.ApprovalMethod))
            {
                if (!Enum.TryParse<ApprovalMethod>(body.ApprovalMethod, ignoreCase: true, out var parsed))
                {
                    return Results.Problem(
                        title: "enrollments.record.invalid_approval_method",
                        detail: $"ApprovalMethod '{body.ApprovalMethod}' is not valid.",
                        statusCode: StatusCodes.Status400BadRequest);
                }
                method = parsed;
            }

            var command = new RegisterEnrollmentCommand(
                userId.Value,
                body.SubjectId,
                body.CommissionId,
                body.TermId,
                status,
                method,
                body.Grade);

            try
            {
                var result = await bus.InvokeAsync<Result<RegisterEnrollmentResponse>>(command, ct);
                if (result.IsSuccess)
                {
                    return Results.Created(
                        $"/api/me/enrollment-records/{result.Value.Id}", result.Value);
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
        .WithName("Enrollments_RegisterEnrollment")
        .WithTags("Enrollments")
        .RequireAuthorization()
        .Produces<RegisterEnrollmentResponse>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }
}
