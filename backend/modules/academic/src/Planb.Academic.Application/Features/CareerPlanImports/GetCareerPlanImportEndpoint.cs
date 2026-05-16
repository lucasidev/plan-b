using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Academic.Application.Abstractions.Security;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Academic.Application.Features.CareerPlanImports;

/// <summary>
/// GET /api/me/career-plan-imports/{id}. El frontend pollea hasta ver el aggregate en
/// Parsed/Failed/Approved. Mismo patrón que el GET de US-014.
/// </summary>
public sealed class GetCareerPlanImportEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/me/career-plan-imports/{id:guid}", async (
            Guid id,
            HttpContext http,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            var userId = CurrentUser.RequireUserId(http);

            var query = new GetCareerPlanImportQuery(userId, id);
            var result = await bus.InvokeAsync<Result<CareerPlanImportResponse>>(query, ct);
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
        .WithName("Academic_GetCareerPlanImport")
        .WithTags("Academic")
        .RequireAuthorization()
        .Produces<CareerPlanImportResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
