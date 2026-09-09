using Planb.Academic.Domain.OfficialFacts;

namespace Planb.Academic.Application.Features.OfficialFacts;

/// <summary>
/// La vigente de cada campo, en la forma de respuesta HTTP (ADR-0090). La comparten el bloque de
/// datos oficiales de una ficha (<see cref="GetOfficialFactsForSubjectEndpoint"/>) y Dónde
/// estudiarla (R6 tarea 5): las mismas seis afirmaciones, con la misma forma, sin importar si se
/// muestran una ficha a la vez o varias lado a lado.
/// </summary>
public static class OfficialFactResponseMapper
{
    public static IReadOnlyList<OfficialFactResponseItem> SelectCurrentByField(
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
