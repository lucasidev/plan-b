using Planb.Academic.Domain.Universities;

namespace Planb.Academic.Domain.Careers;

/// <summary>
/// Repo del aggregate Career. US-088 introdujo Add + FindByUniversityAndSlug para el crowdsourcing;
/// US-061 suma el read-por-id y los checks de unicidad (slug, code) para el CRUD admin. Los reads
/// de listado del backoffice van por el reader Dapper.
/// </summary>
public interface ICareerRepository
{
    Task AddAsync(Career career, CancellationToken ct = default);

    /// <summary>
    /// Busca por (university_id, slug). Match exacto. Se usa para detectar duplicados cuando
    /// el alumno tipea una carrera que ya existe en el catálogo (oficial o crowdsourced).
    /// </summary>
    Task<Career?> FindByUniversityAndSlugAsync(
        UniversityId universityId, string slug, CancellationToken ct = default);

    /// <summary>Carga el aggregate por id para editar/desactivar/reactivar. Null si no existe.</summary>
    Task<Career?> FindByIdAsync(CareerId id, CancellationToken ct = default);

    /// <summary>
    /// True si ya existe una Career con ese (university, slug). <paramref name="excludeId"/> ignora
    /// la propia fila al validar un Update.
    /// </summary>
    Task<bool> ExistsBySlugAsync(
        UniversityId universityId, string slug, CareerId? excludeId, CancellationToken ct = default);

    /// <summary>
    /// True si ya existe una Career con ese (university, code). El caller solo invoca cuando el
    /// code no es null (es opcional). <paramref name="excludeId"/> ignora la propia fila al validar
    /// un Update.
    /// </summary>
    Task<bool> ExistsByCodeAsync(
        UniversityId universityId, string code, CareerId? excludeId, CancellationToken ct = default);
}
