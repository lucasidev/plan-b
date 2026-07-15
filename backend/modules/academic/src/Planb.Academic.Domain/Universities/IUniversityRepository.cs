namespace Planb.Academic.Domain.Universities;

/// <summary>
/// Write-side del aggregate <see cref="University"/> (US-060, admin CRUD). Los reads del catálogo
/// público van por <c>IAcademicQueryService</c> (Dapper) o el reader del backoffice (admin); este
/// repo es solo para cargar el aggregate a mutar y agregarlo. El SaveChanges lo hace el
/// <c>IAcademicUnitOfWork</c>.
/// </summary>
public interface IUniversityRepository
{
    Task AddAsync(University university, CancellationToken ct = default);

    /// <summary>Carga el aggregate por id para editar/desactivar/reactivar. Null si no existe.</summary>
    Task<University?> FindByIdAsync(UniversityId id, CancellationToken ct = default);

    /// <summary>
    /// True si ya existe una University con ese slug (comparación exacta; el caller normaliza
    /// antes de invocar). <paramref name="excludeId"/> permite ignorar la propia fila al validar
    /// un Update (una University puede "colisionar" consigo misma si no cambió el slug).
    /// </summary>
    Task<bool> ExistsBySlugAsync(
        string slug, UniversityId? excludeId, CancellationToken ct = default);
}
