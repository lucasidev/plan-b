using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Academic.Application.Features.AdminUniversities;

/// <summary>
/// GET /api/academic/universities/{id} (admin, US-060). Detalle completo (incluye isActive) para
/// el form de edición del backoffice. Gateado a rol Admin: no colisiona con el catálogo público
/// (que no expone un GET por id de universidad hoy).
/// </summary>
public sealed class GetUniversityEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/academic/universities/{id:guid}", async (
            Guid id,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            if (id == Guid.Empty)
            {
                return Results.Problem(
                    title: "academic.university.not_found",
                    detail: "University not found.",
                    statusCode: StatusCodes.Status404NotFound);
            }

            var result = await bus.InvokeAsync<Result<UniversityDetailResponse>>(
                new GetUniversityQuery(id), ct);
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
            return Results.Problem(title: error.Code, detail: error.Message, statusCode: statusCode);
        })
        .WithName("Academic_GetUniversity")
        .WithTags("Academic")
        .RequireAuthorization(p => p.RequireRole(AdminUniversityPolicy.RoleName))
        .Produces<UniversityDetailResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
