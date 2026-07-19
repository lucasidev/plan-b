using Planb.Academic.Domain.Universities;

namespace Planb.Academic.Application.Features.AdminCareers;

/// <summary>
/// Read-side del listado de carreras de una universidad para el backoffice (admin, US-061). A
/// diferencia del catálogo público (<c>IAcademicQueryService.ListCareersByUniversityAsync</c>,
/// que no filtra por estado y no expone shortName/code), este trae activas e inactivas con su
/// estado + count de planes, así el admin las ve y puede reactivarlas. No es cross-BC: lo consume
/// el propio módulo Academic, por eso vive en el feature y no en Contracts/IAcademicQueryService.
/// </summary>
public interface IAdminCareerReader
{
    /// <summary>Lista las carreras de una universidad. Orden por nombre.</summary>
    Task<IReadOnlyList<AdminCareerListItem>> ListByUniversityAsync(
        UniversityId universityId, CancellationToken ct = default);
}
