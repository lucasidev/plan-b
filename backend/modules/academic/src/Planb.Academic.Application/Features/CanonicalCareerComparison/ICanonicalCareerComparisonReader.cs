namespace Planb.Academic.Application.Features.CanonicalCareerComparison;

/// <summary>
/// Las ofertas del grupo de carrera canónica al que pertenece una carrera (declarado por el
/// equipo en <c>CanonicalCareerGroupings</c>, US-195), en todas las ciudades donde se dicta. El
/// filtro por la ciudad de la carrera de partida corre después, en
/// <see cref="Planb.Academic.Domain.Careers.CanonicalCareerComparisonPolicy"/>: este reader sólo
/// junta. Si la carrera no pertenece a ningún grupo declarado, trae solo su propia fila (grupo de
/// una) y <see cref="CanonicalCareerGroupRows.GroupName"/> sale null.
/// </summary>
public interface ICanonicalCareerComparisonReader
{
    /// <summary>Null cuando <paramref name="careerId"/> no existe en el catálogo.</summary>
    Task<CanonicalCareerGroupRows?> GetGroupAsync(Guid careerId, CancellationToken ct = default);
}

/// <summary>Las filas del grupo, con el nombre que el equipo le dio a la carrera canónica (o null si la carrera de partida no está agrupada).</summary>
public sealed record CanonicalCareerGroupRows(
    string? GroupName, IReadOnlyList<CanonicalCareerOfferingRow> Offerings);
