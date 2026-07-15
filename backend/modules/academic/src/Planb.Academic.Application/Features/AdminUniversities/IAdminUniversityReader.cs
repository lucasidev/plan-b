namespace Planb.Academic.Application.Features.AdminUniversities;

/// <summary>
/// Read-side del listado de universidades para el backoffice (admin, US-060). A diferencia del
/// catálogo público (<c>IAcademicQueryService.ListUniversitiesAsync</c>, que no filtra por estado
/// y devuelve un shape mínimo id/name/slug), este trae activas e inactivas con su estado + count
/// de careers, así el admin las ve y puede reactivarlas. No es cross-BC: lo consume el propio
/// módulo Academic, por eso vive en el feature y no en Contracts/IAcademicQueryService.
/// </summary>
public interface IAdminUniversityReader
{
    /// <summary>Lista las universidades del catálogo. Orden por nombre.</summary>
    Task<IReadOnlyList<AdminUniversityListItem>> ListAsync(CancellationToken ct = default);
}
