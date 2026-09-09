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
}
