using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Academic.Application.Contracts;

namespace Planb.Academic.Application.Features.PublicCatalog;

/// <summary>
/// GET /api/academic/subjects/{id}: metadata de una materia por id (US-002).
///
/// Caller: la página pública de materia. Sin auth, el catálogo es público. Materia inexistente
/// devuelve 404 (a diferencia del listado por plan, que devuelve lista vacía: acá el id apunta a
/// un recurso concreto, así que su ausencia es un 404 honesto).
/// </summary>
public sealed class GetSubjectEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/academic/subjects/{id:guid}", async (
            Guid id,
            IAcademicQueryService queries,
            CancellationToken ct) =>
        {
            var subject = await queries.GetSubjectByIdAsync(id, ct);
            return subject is null
                ? Results.Problem(
                    title: "academic.subject.not_found",
                    detail: "Subject not found.",
                    statusCode: StatusCodes.Status404NotFound)
                : Results.Ok(subject);
        })
        .WithName("Academic_GetSubject")
        .WithTags("Academic")
        .Produces<SubjectDetailItem>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .AllowAnonymous();
    }
}
