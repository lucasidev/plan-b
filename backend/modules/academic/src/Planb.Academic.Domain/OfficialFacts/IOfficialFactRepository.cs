namespace Planb.Academic.Domain.OfficialFacts;

/// <summary>
/// Write-side del aggregate <see cref="OfficialFact"/>. Es un ledger de solo alta (ADR-0090: no hay
/// Update, "corregir" es cargar una afirmación nueva), así que el repo solo agrega. El read para las
/// fichas (afirmaciones vigentes por sujeto) va por Dapper: ver <c>IOfficialFactReader</c>.
/// </summary>
public interface IOfficialFactRepository
{
    Task AddAsync(OfficialFact officialFact, CancellationToken ct = default);
}
