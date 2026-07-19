using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Academic.Application.Features.AdminAcademicTerms;

/// <summary>
/// GET /api/academic/academic-terms/{id} (admin, US-064). Detalle completo para el form de
/// edición del backoffice. Gateado a rol Admin: no colisiona con el catálogo público
/// (<c>GET /api/academic/academic-terms?universityId=</c>, que no tiene segmento de id de recurso).
/// </summary>
public sealed class GetAcademicTermEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/academic/academic-terms/{id:guid}", async (
            Guid id,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            if (id == Guid.Empty)
            {
                return Results.Problem(
                    title: "academic.term.not_found",
                    detail: "AcademicTerm not found.",
                    statusCode: StatusCodes.Status404NotFound);
            }

            var result = await bus.InvokeAsync<Result<AcademicTermDetailResponse>>(
                new GetAcademicTermQuery(id), ct);
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
        .WithName("Academic_GetAcademicTerm")
        .WithTags("Academic")
        .RequireAuthorization(p => p.RequireRole(AdminAcademicTermPolicy.RoleName))
        .Produces<AcademicTermDetailResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
