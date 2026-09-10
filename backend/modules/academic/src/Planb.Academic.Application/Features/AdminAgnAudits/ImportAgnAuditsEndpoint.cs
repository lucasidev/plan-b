using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Academic.Application.Features.AdminAgnAudits;

/// <summary>
/// POST /api/academic/agn-audits/import (admin, issue #506). Dispara la importación de auditorías
/// de la AGN para todo el catálogo. Gateado a rol Admin: es quien sostiene el catálogo quien la
/// corre, nunca un proceso sin supervisión.
/// </summary>
public sealed class ImportAgnAuditsEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/academic/agn-audits/import", async (
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var result = await bus.InvokeAsync<Result<ImportAgnAuditsResponse>>(
                new ImportAgnAuditsCommand(), ct);
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
            return Results.Problem(title: error.Code, detail: error.Message, statusCode: statusCode);
        })
        .WithName("Academic_ImportAgnAudits")
        .WithTags("Academic")
        .RequireAuthorization(p => p.RequireRole(AdminAgnAuditPolicy.RoleName))
        .Produces<ImportAgnAuditsResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status500InternalServerError);
    }
}
