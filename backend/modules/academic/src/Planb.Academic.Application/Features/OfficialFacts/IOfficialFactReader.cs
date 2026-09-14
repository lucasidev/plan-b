using Planb.Academic.Domain.OfficialFacts;

namespace Planb.Academic.Application.Features.OfficialFacts;

/// <summary>
/// Read-side de <see cref="OfficialFact"/> para las fichas (ADR-0090). Devuelve TODAS las
/// afirmaciones de un sujeto, sin filtrar la vigente: esa decisión la toma el dominio
/// (<see cref="OfficialFactCurrency"/>) sobre lo que este reader trae, nunca el SQL.
/// </summary>
public interface IOfficialFactReader
{
    Task<IReadOnlyList<OfficialFactListItem>> ListBySubjectAsync(
        OfficialFactSubjectType subjectType, Guid subjectId, CancellationToken ct = default);

    /// <summary>Todas las afirmaciones de todos los sujetos de <paramref name="subjectType"/>, sin elegir la vigente (ese criterio sigue corriendo en <see cref="OfficialFactCurrency"/>, agrupado por sujeto y campo).</summary>
    Task<IReadOnlyList<OfficialFactListItem>> ListBySubjectTypeAsync(
        OfficialFactSubjectType subjectType, CancellationToken ct = default);
}
