using Planb.Academic.Domain.Universities;

namespace Planb.Academic.Domain.Careers;

/// <summary>
/// Repo del aggregate Career. US-088 introduce los métodos de write porque hasta entonces
/// el catálogo se manejaba solo desde seeder. Mínimo viable: Add + FindBySlug para conflict
/// resolution.
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
}
