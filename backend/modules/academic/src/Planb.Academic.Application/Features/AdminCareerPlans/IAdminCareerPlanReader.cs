using Planb.Academic.Domain.Careers;

namespace Planb.Academic.Application.Features.AdminCareerPlans;

/// <summary>
/// Read-side del listado de planes de estudio de una carrera para el backoffice (admin, US-061). No
/// es cross-BC: lo consume el propio módulo Academic, por eso vive en el feature y no en
/// Contracts/IAcademicQueryService.
/// </summary>
public interface IAdminCareerPlanReader
{
    /// <summary>Lista los planes de una carrera (Active + Deprecated). Orden por year descendente.</summary>
    Task<IReadOnlyList<AdminCareerPlanListItem>> ListByCareerAsync(
        CareerId careerId, CancellationToken ct = default);
}
