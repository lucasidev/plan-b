using Planb.Academic.Domain.OfficialFacts;

namespace Planb.Academic.Application.Features.OfficialFacts;

/// <summary>
/// Fila cruda del read de <see cref="OfficialFact"/> (una por afirmación, no por campo): Dapper
/// mapea por nombre de columna. Implementa <see cref="IRelievedClaim"/> para que
/// <see cref="OfficialFactCurrency.SelectCurrent{T}"/> corra directo sobre estas filas sin
/// rehidratar el aggregate completo.
/// </summary>
public sealed record OfficialFactListItem : IRelievedClaim
{
    public Guid Id { get; init; }
    public string Field { get; init; } = string.Empty;
    public string? Value { get; init; }
    public string? Unit { get; init; }
    public string? Period { get; init; }
    public string SourceName { get; init; } = string.Empty;
    public string SourceUrl { get; init; } = string.Empty;
    public string? SourceDocument { get; init; }
    public DateTimeOffset SourceRetrievedAt { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? DerivationRuleId { get; init; }
    public string? Note { get; init; }
    public DateTimeOffset RelievedAt { get; init; }
    public DateTimeOffset CreatedAt { get; init; }
}
