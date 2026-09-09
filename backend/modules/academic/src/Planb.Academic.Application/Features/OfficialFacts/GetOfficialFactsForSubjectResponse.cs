namespace Planb.Academic.Application.Features.OfficialFacts;

/// <summary>Las afirmaciones vigentes de un sujeto, una por campo (ADR-0090).</summary>
public sealed record GetOfficialFactsForSubjectResponse(IReadOnlyList<OfficialFactResponseItem> Facts);

/// <summary>
/// Una afirmación vigente, lista para la ficha: su valor con unidad y período, su estado, y su
/// fuente completa. Sin <c>RelievedBy</c>: es la identidad de quien la cargó (staff), no un dato
/// para la ficha pública.
/// </summary>
public sealed record OfficialFactResponseItem(
    Guid Id,
    string Field,
    string? Value,
    string? Unit,
    string? Period,
    string Status,
    string SourceName,
    string SourceUrl,
    string? SourceDocument,
    DateTimeOffset SourceRetrievedAt,
    string? DerivationRuleId,
    string? Note,
    DateTimeOffset RelievedAt);
