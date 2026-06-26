using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Academic.Application.Contracts;

namespace Planb.Academic.Application.Features.PublicCatalog;

/// <summary>
/// GET /api/academic/teachers/{id}: metadata de un docente por id (US-003).
///
/// Caller: la página pública de docente. Sin auth, el catálogo es público. Docente inexistente
/// devuelve 404 (mismo criterio que GetSubject: el id apunta a un recurso concreto, su ausencia
/// es un 404 honesto).
/// </summary>
public sealed class GetTeacherEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/academic/teachers/{id:guid}", async (
            Guid id,
            IAcademicQueryService queries,
            CancellationToken ct) =>
        {
            var teacher = await queries.GetTeacherByIdAsync(id, ct);
            return teacher is null
                ? Results.Problem(
                    title: "academic.teacher.not_found",
                    detail: "Teacher not found.",
                    statusCode: StatusCodes.Status404NotFound)
                : Results.Ok(teacher);
        })
        .WithName("Academic_GetTeacher")
        .WithTags("Academic")
        .Produces<TeacherDetailItem>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .AllowAnonymous();
    }
}
