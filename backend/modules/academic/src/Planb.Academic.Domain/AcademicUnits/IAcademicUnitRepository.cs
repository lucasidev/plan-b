using Planb.Academic.Domain.Universities;

namespace Planb.Academic.Domain.AcademicUnits;

/// <summary>
/// Write-side del aggregate <see cref="AcademicUnit"/>. Mismo patrón que <c>ICareerRepository</c>:
/// slug único por universidad, sin FK cross-aggregate (ADR-0017).
/// </summary>
public interface IAcademicUnitRepository
{
    Task AddAsync(AcademicUnit academicUnit, CancellationToken ct = default);

    /// <summary>Carga el aggregate por id para editar/desactivar/reactivar/validar existencia. Null si no existe.</summary>
    Task<AcademicUnit?> FindByIdAsync(AcademicUnitId id, CancellationToken ct = default);

    /// <summary>
    /// True si ya existe una AcademicUnit con ese (university, slug). <paramref name="excludeId"/>
    /// ignora la propia fila al validar un Update.
    /// </summary>
    Task<bool> ExistsBySlugAsync(
        UniversityId universityId, string slug, AcademicUnitId? excludeId, CancellationToken ct = default);
}
