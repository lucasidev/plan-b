using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Planb.Academic.Application.Features.OfficialFacts;

/// <summary>
/// GET /api/academic/official-facts/by-subject-type?subjectType={type}: las afirmaciones vigentes
/// de TODOS los sujetos de ese tipo, agrupadas por sujeto (ADR-0090). Público (lectura sin
/// cuenta): sin autorización, igual que el resto del catálogo.
///
/// <para>
/// Distinto de <see cref="GetOfficialFactsForSubjectEndpoint"/> (un sujeto, lista plana): acá la
/// respuesta agrupa por <c>subjectId</c> porque el caller quiere comparar varios sujetos a la vez
/// (el checklist de transparencia de las cinco instituciones, por ejemplo) sin que sus
/// afirmaciones se mezclen. La selección de cuál es la vigente corre por sujeto y campo en
/// <see cref="OfficialFactResponseMapper.GroupBySubject"/>, nunca en el SQL del reader.
/// </para>
/// </summary>
public sealed class GetOfficialFactsBySubjectTypeEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/academic/official-facts/by-subject-type", async (
            string? subjectType,
            IOfficialFactReader reader,
            CancellationToken ct) =>
        {
            var parsedType = OfficialFactEnumParsing.ParseSubjectType(subjectType);
            if (parsedType.IsFailure)
            {
                return Results.Problem(
                    title: parsedType.Error.Code, detail: parsedType.Error.Message,
                    statusCode: StatusCodes.Status400BadRequest);
            }

            var rows = await reader.ListBySubjectTypeAsync(parsedType.Value, ct);
            var subjects = OfficialFactResponseMapper.GroupBySubject(rows);
            return Results.Ok(new GetOfficialFactsBySubjectTypeResponse(subjects));
        })
        .WithName("Academic_GetOfficialFactsBySubjectType")
        .WithTags("Academic")
        .AllowAnonymous()
        .Produces<GetOfficialFactsBySubjectTypeResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest);
    }
}
