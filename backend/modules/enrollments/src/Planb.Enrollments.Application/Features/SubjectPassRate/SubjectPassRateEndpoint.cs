using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Planb.Enrollments.Application.Features.SubjectPassRate;

/// <summary>
/// GET /api/enrollments/subjects/{subjectId}/pass-rate (ADR-0047): aprobación histórica de una
/// materia. Público: es un stat de comunidad, agregado y anonimizado (nunca expone cursadas
/// individuales). Una materia sin cursadas (o id inexistente) devuelve <c>SampleSize 0</c> +
/// <c>PassRate null</c>, no 404: la existencia de la materia la resuelve la página vía academic.
/// </summary>
public sealed class SubjectPassRateEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/enrollments/subjects/{subjectId:guid}/pass-rate", async (
            Guid subjectId,
            ISubjectPassRateReader reader,
            CancellationToken ct) =>
        {
            var result = await reader.GetForSubjectAsync(subjectId, ct);
            return Results.Ok(result);
        })
        .WithName("Enrollments_SubjectPassRate")
        .WithTags("Enrollments")
        .AllowAnonymous()
        .Produces<SubjectPassRate>(StatusCodes.Status200OK);
    }
}
