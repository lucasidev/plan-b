using Planb.Academic.Domain.OfficialFacts;

namespace Planb.Academic.Application.Features.AdminAgnAudits;

/// <summary>
/// Una afirmación <c>agn_audit</c> existente, con el nombre de su institución (issue #506). Record
/// property-init (no posicional): Dapper mapea por nombre de columna. Solo trae instituciones que
/// tienen al menos una afirmación: una institución nunca consultada no aparece acá (ver
/// <see cref="AdminAgnAuditResponseMapper"/>, que la completa contra el catálogo entero).
/// Implementa <see cref="IRelievedClaim"/> para que <see cref="OfficialFactCurrency.SelectCurrent{T}"/>
/// elija la vigente cuando una institución acumuló más de un import.
/// </summary>
public sealed record AdminAgnAuditFactRow : IRelievedClaim
{
    public Guid UniversityId { get; init; }
    public string UniversityName { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string? Value { get; init; }
    public string? Period { get; init; }
    public string SourceUrl { get; init; } = string.Empty;
    public DateTimeOffset SourceRetrievedAt { get; init; }
    public DateTimeOffset RelievedAt { get; init; }
    public DateTimeOffset CreatedAt { get; init; }
}
