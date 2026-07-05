namespace Planb.Academic.Application.Features.AdminTeachers;

/// <summary>
/// Read-side del listado de docentes para el backoffice (admin, US-063). A diferencia del query
/// service público (que 410ea los inactivos), este trae activos e inactivos con su estado, así el
/// admin los ve y puede reactivarlos. No es cross-BC: lo consume el propio módulo Academic, por eso
/// vive en el feature y no en Contracts/IAcademicQueryService.
/// </summary>
public interface IAdminTeacherReader
{
    /// <summary>
    /// Lista los docentes del catálogo, opcionalmente filtrados por universidad. Nombres en title
    /// case listos para display. Orden por (apellido, nombre).
    /// </summary>
    Task<IReadOnlyList<AdminTeacherListItem>> ListAsync(
        Guid? universityId, CancellationToken ct = default);
}
