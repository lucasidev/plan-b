using Planb.Academic.Domain.Careers;

namespace Planb.Academic.Application.Features.CanonicalCareerComparison;

/// <summary>
/// Fila cruda de una oferta del grupo de carrera canónica (R6, tarea 5): identidad de la carrera,
/// de la universidad y de la unidad académica que la dicta, más lo que hace falta para agrupar por
/// ciudad (<see cref="ILocatedOffering"/>). Dapper mapea por nombre de columna.
/// </summary>
public sealed record CanonicalCareerOfferingRow : ILocatedOffering
{
    public Guid CareerId { get; init; }
    public string CareerName { get; init; } = string.Empty;
    public Guid UniversityId { get; init; }
    public string UniversityName { get; init; } = string.Empty;
    public string? AcademicUnitName { get; init; }
    public string? LocalityId { get; init; }
    public string? LocalityName { get; init; }
    public string Province { get; init; } = string.Empty;
}
