using Carter;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Enrollments.Domain.HistorialImports;
using Planb.Identity.Application.Abstractions.Security;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Enrollments.Application.Features.HistorialImports;

/// <summary>
/// POST /api/me/historial-imports (US-014).
///
/// Acepta dos shapes:
/// <list type="bullet">
///   <item><b>multipart/form-data</b> con un field <c>file</c> (PDF, máx 5MB). Source=Pdf.</item>
///   <item><b>application/json</b> con <c>{ "rawText": "..." }</c> (texto pegado por el user). Source=Text.</item>
/// </list>
///
/// El endpoint solo arma el comando y lo despacha. El handler crea el aggregate Pending +
/// publica el <c>ProcessHistorialImportCommand</c> al outbox de Wolverine. La respuesta es 202
/// con el id; el frontend hace polling al GET para enterarse cuándo está Parsed.
/// </summary>
public sealed class CreateHistorialImportEndpoint : ICarterModule
{
    /// <summary>Hard limit del payload (PDF o texto). Coincide con el límite documentado al user.</summary>
    public const long MaxPayloadBytes = 5 * 1024 * 1024;

    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/me/historial-imports", async (
            HttpContext http,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var userId = CurrentUser.RequireUserId(http);

            CreateHistorialImportCommand command;
            if (http.Request.HasFormContentType)
            {
                // multipart con PDF
                var form = await http.Request.ReadFormAsync(ct);
                var file = form.Files["file"] ?? form.Files.FirstOrDefault();
                if (file is null || file.Length == 0)
                {
                    return ProblemFromError(HistorialImportErrors.EmptyPayload);
                }
                if (file.Length > MaxPayloadBytes)
                {
                    return ProblemFromError(HistorialImportErrors.PayloadTooLarge);
                }

                using var ms = new MemoryStream();
                await file.CopyToAsync(ms, ct);
                var bytes = ms.ToArray();

                command = new CreateHistorialImportCommand(
                    userId.Value,
                    HistorialImportSourceType.Pdf,
                    PdfBytes: bytes,
                    RawText: null);
            }
            else
            {
                // JSON con texto pegado
                CreateHistorialImportRequest? body;
                try
                {
                    body = await http.Request.ReadFromJsonAsync<CreateHistorialImportRequest>(ct);
                }
                catch (System.Text.Json.JsonException)
                {
                    return Results.Problem(
                        title: "enrollments.import.invalid_body",
                        detail: "El body no es JSON válido ni un multipart/form-data.",
                        statusCode: StatusCodes.Status400BadRequest);
                }

                var raw = body?.RawText ?? string.Empty;
                if (string.IsNullOrWhiteSpace(raw))
                {
                    return ProblemFromError(HistorialImportErrors.EmptyPayload);
                }
                if (System.Text.Encoding.UTF8.GetByteCount(raw) > MaxPayloadBytes)
                {
                    return ProblemFromError(HistorialImportErrors.PayloadTooLarge);
                }

                command = new CreateHistorialImportCommand(
                    userId.Value,
                    HistorialImportSourceType.Text,
                    PdfBytes: null,
                    RawText: raw);
            }

            try
            {
                var result = await bus.InvokeAsync<Result<CreateHistorialImportResponse>>(command, ct);
                if (result.IsSuccess)
                {
                    return Results.Accepted(
                        $"/api/me/historial-imports/{result.Value.Id}",
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
        .WithName("Enrollments_CreateHistorialImport")
        .WithTags("Enrollments")
        .RequireAuthorization()
        .DisableAntiforgery()
        .Produces<CreateHistorialImportResponse>(StatusCodes.Status202Accepted)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }

    private static IResult ProblemFromError(Error error)
    {
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
}

/// <summary>
/// Body JSON cuando el user pega el texto en lugar de subir un PDF.
/// </summary>
public sealed record CreateHistorialImportRequest(string RawText);
