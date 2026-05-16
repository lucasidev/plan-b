using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Identity.Application.Abstractions.Security;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Enrollments.Application.Features.HistorialImports;

/// <summary>
/// GET /api/me/historial-imports/{id} (US-014).
///
/// Endpoint que el frontend pollea hasta ver el import en estado terminal del flujo de parseo:
/// <list type="bullet">
///   <item><c>Parsed</c>: hay <c>Payload</c>, el user puede revisar el preview.</item>
///   <item><c>Failed</c>: hay <c>Error</c>, mostrar mensaje + ofrecer reintentar / manual.</item>
///   <item><c>Confirmed</c>: terminal, redirigir.</item>
/// </list>
/// </summary>
public sealed class GetHistorialImportEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/me/historial-imports/{id:guid}", async (
            Guid id,
            HttpContext http,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var userId = CurrentUser.RequireUserId(http);

            var query = new GetHistorialImportQuery(userId.Value, id);
            var result = await bus.InvokeAsync<Result<HistorialImportResponse>>(query, ct);
            if (result.IsSuccess)
            {
                return Results.Ok(result.Value);
            }

            var error = result.Error;
            var statusCode = error.Type switch
            {
                ErrorType.NotFound => StatusCodes.Status404NotFound,
                ErrorType.Forbidden => StatusCodes.Status403Forbidden,
                ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
                _ => StatusCodes.Status500InternalServerError,
            };
            return Results.Problem(
                title: error.Code,
                detail: error.Message,
                statusCode: statusCode);
        })
        .WithName("Enrollments_GetHistorialImport")
        .WithTags("Enrollments")
        .RequireAuthorization()
        .Produces<HistorialImportResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
