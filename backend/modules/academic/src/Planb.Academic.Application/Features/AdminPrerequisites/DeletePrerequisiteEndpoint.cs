using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Academic.Domain.Prerequisites;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Academic.Application.Features.AdminPrerequisites;

/// <summary>
/// DELETE /api/academic/subjects/{subjectId:guid}/prerequisites/{requiredSubjectId:guid}/{type}
/// (admin, US-062). Baja de una correlativa puntual. Type viaja como segmento de ruta (string,
/// "ToEnroll"/"ToTakeFinal"); mismo criterio de parseo que en el POST. Gateado a rol Admin.
/// </summary>
public sealed class DeletePrerequisiteEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapDelete(
            "/api/academic/subjects/{subjectId:guid}/prerequisites/{requiredSubjectId:guid}/{type}",
            async (
                Guid subjectId,
                Guid requiredSubjectId,
                string type,
                IMessageBus bus,
                CancellationToken ct) =>
            {
                // Guid.Empty pasa el route constraint :guid pero SubjectId lo rechaza en su ctor:
                // cortamos acá para 404 limpio (mismo criterio que los demás endpoints admin).
                if (subjectId == Guid.Empty || requiredSubjectId == Guid.Empty)
                {
                    return Results.Problem(
                        title: PrerequisiteErrors.NotFound.Code,
                        detail: PrerequisiteErrors.NotFound.Message,
                        statusCode: StatusCodes.Status404NotFound);
                }

                var parsedType = PrerequisiteEnumParsing.ParseType(type);
                if (parsedType.IsFailure)
                {
                    return Results.Problem(
                        title: parsedType.Error.Code, detail: parsedType.Error.Message,
                        statusCode: StatusCodes.Status400BadRequest);
                }

                var result = await bus.InvokeAsync<Result>(
                    new DeletePrerequisiteCommand(subjectId, requiredSubjectId, parsedType.Value), ct);
                if (result.IsSuccess)
                {
                    return Results.NoContent();
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
        .WithName("Academic_DeletePrerequisite")
        .WithTags("Academic")
        .RequireAuthorization(p => p.RequireRole(AdminPrerequisitePolicy.RoleName))
        .Produces(StatusCodes.Status204NoContent)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
