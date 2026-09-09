using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Planb.Academic.Domain.OfficialFacts;

namespace Planb.Academic.Application.Features.OfficialFacts;

/// <summary>
/// GET /api/academic/official-facts?subjectType={type}&amp;subjectId={id}: las afirmaciones
/// vigentes de un sujeto, listas para el bloque de datos oficiales de una ficha (ADR-0090).
/// Público (lectura sin cuenta): sin autorización, igual que el resto del catálogo.
///
/// <para>
/// Query, no Command: no hay CommandHandler separado (mismo criterio que
/// <c>PublicCatalog/ListCareersEndpoint</c>). El reader trae todas las afirmaciones del sujeto; la
/// selección de cuál es la vigente por campo corre acá, delegada al dominio
/// (<see cref="OfficialFactCurrency"/>), nunca en el SQL del reader.
/// </para>
/// </summary>
public sealed class GetOfficialFactsForSubjectEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/academic/official-facts", async (
            string? subjectType,
            Guid? subjectId,
            IOfficialFactReader reader,
            CancellationToken ct) =>
        {
            if (subjectId is null || subjectId == Guid.Empty)
            {
                return Results.Problem(
                    title: "academic.official_fact.missing_subject_id",
                    detail: "subjectId query parameter is required.",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            var parsedType = OfficialFactEnumParsing.ParseSubjectType(subjectType);
            if (parsedType.IsFailure)
            {
                return Results.Problem(
                    title: parsedType.Error.Code, detail: parsedType.Error.Message,
                    statusCode: StatusCodes.Status400BadRequest);
            }

            var rows = await reader.ListBySubjectAsync(parsedType.Value, subjectId.Value, ct);
            return Results.Ok(new GetOfficialFactsForSubjectResponse(SelectCurrentByField(rows)));
        })
        .WithName("Academic_GetOfficialFactsForSubject")
        .WithTags("Academic")
        .AllowAnonymous()
        .Produces<GetOfficialFactsForSubjectResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest);
    }

    private static IReadOnlyList<OfficialFactResponseItem> SelectCurrentByField(
        IReadOnlyList<OfficialFactListItem> rows) =>
        rows
            .GroupBy(r => r.Field)
            .Select(group => OfficialFactCurrency.SelectCurrent(group.ToList()))
            .OrderBy(r => r.Field, StringComparer.Ordinal)
            .Select(r => new OfficialFactResponseItem(
                r.Id, r.Field, r.Value, r.Unit, r.Period, r.Status,
                r.SourceName, r.SourceUrl, r.SourceDocument, r.SourceRetrievedAt,
                r.DerivationRuleId, r.Note, r.RelievedAt))
            .ToList();
}
