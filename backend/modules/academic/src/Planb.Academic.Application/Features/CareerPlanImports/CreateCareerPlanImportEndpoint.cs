using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Academic.Application.Abstractions.Security;
using Planb.Academic.Domain.CareerPlanImports;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Academic.Application.Features.CareerPlanImports;

/// <summary>
/// POST /api/me/career-plan-imports (US-088). Acepta:
/// <list type="bullet">
///   <item><b>multipart/form-data</b>: campo <c>file</c> con el PDF + campos <c>universityId</c>,
///         <c>careerName</c>, <c>planYear</c>, <c>studentEnrollmentYear</c> (form fields).</item>
///   <item><b>application/json</b>: { universityId, careerName, planYear, studentEnrollmentYear,
///         rawText } cuando el alumno pega el texto.</item>
/// </list>
/// Mismo patrón que el endpoint de US-014, adaptado al contexto del plan.
/// </summary>
public sealed class CreateCareerPlanImportEndpoint : ICarterModule
{
    public const long MaxPayloadBytes = 5 * 1024 * 1024;

    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/me/career-plan-imports", async (
            HttpContext http,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var userId = CurrentUser.RequireUserId(http);

            CreateCareerPlanImportCommand command;
            if (http.Request.HasFormContentType)
            {
                var form = await http.Request.ReadFormAsync(ct);
                var file = form.Files["file"] ?? form.Files.FirstOrDefault();
                if (file is null || file.Length == 0)
                {
                    return ProblemFromError(CareerPlanImportErrors.EmptyPayload);
                }
                if (file.Length > MaxPayloadBytes)
                {
                    return ProblemFromError(CareerPlanImportErrors.PayloadTooLarge);
                }

                if (!Guid.TryParse(form["universityId"], out var universityId))
                {
                    return Results.Problem(
                        title: "academic.plan_import.invalid_university_id",
                        detail: "El universityId no es un GUID válido.",
                        statusCode: StatusCodes.Status400BadRequest);
                }
                var careerName = form["careerName"].ToString();
                int.TryParse(form["planYear"], out var planYear);
                int.TryParse(form["studentEnrollmentYear"], out var studentEnrollmentYear);

                using var ms = new MemoryStream();
                await file.CopyToAsync(ms, ct);
                var bytes = ms.ToArray();

                command = new CreateCareerPlanImportCommand(
                    userId,
                    universityId,
                    careerName,
                    planYear,
                    studentEnrollmentYear,
                    CareerPlanImportSourceType.Pdf,
                    PdfBytes: bytes,
                    RawText: null);
            }
            else
            {
                CreateCareerPlanImportRequest? body;
                try
                {
                    body = await http.Request.ReadFromJsonAsync<CreateCareerPlanImportRequest>(ct);
                }
                catch (System.Text.Json.JsonException)
                {
                    return Results.Problem(
                        title: "academic.plan_import.invalid_body",
                        detail: "El body no es JSON válido ni un multipart/form-data.",
                        statusCode: StatusCodes.Status400BadRequest);
                }

                if (body is null)
                {
                    return ProblemFromError(CareerPlanImportErrors.EmptyPayload);
                }
                var raw = body.RawText ?? string.Empty;
                if (string.IsNullOrWhiteSpace(raw))
                {
                    return ProblemFromError(CareerPlanImportErrors.EmptyPayload);
                }
                if (System.Text.Encoding.UTF8.GetByteCount(raw) > MaxPayloadBytes)
                {
                    return ProblemFromError(CareerPlanImportErrors.PayloadTooLarge);
                }

                command = new CreateCareerPlanImportCommand(
                    userId,
                    body.UniversityId,
                    body.CareerName,
                    body.PlanYear,
                    body.StudentEnrollmentYear,
                    CareerPlanImportSourceType.Text,
                    PdfBytes: null,
                    RawText: raw);
            }

            try
            {
                var result = await bus.InvokeAsync<Result<CreateCareerPlanImportResponse>>(command, ct);
                if (result.IsSuccess)
                {
                    return Results.Accepted(
                        $"/api/me/career-plan-imports/{result.Value.Id}",
                        result.Value);
                }
                return ProblemFromError(result.Error);
            }
            catch (ValidationException ex)
            {
                var errors = ex.Errors.GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
                return Results.ValidationProblem(errors);
            }
        })
        .WithName("Academic_CreateCareerPlanImport")
        .WithTags("Academic")
        .RequireAuthorization()
        .DisableAntiforgery()
        .Produces<CreateCareerPlanImportResponse>(StatusCodes.Status202Accepted)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status413PayloadTooLarge)
        .ProducesProblem(StatusCodes.Status422UnprocessableEntity);
    }

    private static IResult ProblemFromError(Error error)
    {
        var statusCode = error.Code switch
        {
            "academic.plan_import.payload_too_large" => StatusCodes.Status413PayloadTooLarge,
            "academic.plan_import.encrypted" => StatusCodes.Status422UnprocessableEntity,
            "academic.plan_import.invalid_pdf" => StatusCodes.Status422UnprocessableEntity,
            _ => error.Type switch
            {
                ErrorType.Validation => StatusCodes.Status400BadRequest,
                ErrorType.NotFound => StatusCodes.Status404NotFound,
                ErrorType.Conflict => StatusCodes.Status409Conflict,
                ErrorType.Forbidden => StatusCodes.Status403Forbidden,
                ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
                _ => StatusCodes.Status500InternalServerError,
            },
        };
        return Results.Problem(
            title: error.Code,
            detail: error.Message,
            statusCode: statusCode);
    }
}

public sealed record CreateCareerPlanImportRequest(
    Guid UniversityId,
    string CareerName,
    int PlanYear,
    int StudentEnrollmentYear,
    string RawText);
