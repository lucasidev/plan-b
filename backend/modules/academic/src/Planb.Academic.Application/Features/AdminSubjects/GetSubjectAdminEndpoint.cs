using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Academic.Application.Features.AdminSubjects;

/// <summary>
/// GET /api/academic/career-plans/{planId:guid}/subjects/{subjectId:guid} (admin, US-062). Detalle
/// completo para el form de edición del backoffice. Anidado bajo el plan (a diferencia de
/// Career/AcademicTerm) porque ya existe <c>GET /api/academic/subjects/{id:guid}</c> público
/// (US-002): esta ruta admin no puede colgar del mismo template sin colisionar. Gateado a rol
/// Admin.
/// </summary>
public sealed class GetSubjectAdminEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/academic/career-plans/{planId:guid}/subjects/{subjectId:guid}", async (
            Guid planId,
            Guid subjectId,
            IMessageBus bus,
            CancellationToken ct) =>
        {
            if (planId == Guid.Empty || subjectId == Guid.Empty)
            {
                return Results.Problem(
                    title: "academic.subject.not_found",
                    detail: "Subject not found.",
                    statusCode: StatusCodes.Status404NotFound);
            }

            var result = await bus.InvokeAsync<Result<AdminSubjectListItem>>(
                new GetSubjectAdminQuery(planId, subjectId), ct);
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
        .WithName("Academic_GetSubjectAdmin")
        .WithTags("Academic")
        .RequireAuthorization(p => p.RequireRole(AdminSubjectPolicy.RoleName))
        .Produces<AdminSubjectListItem>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
