using Planb.Academic.Domain.CareerPlans;

namespace Planb.Academic.Application.Features.AdminSubjects;

/// <summary>
/// Read-side del listado de materias de un plan de estudios para el backoffice (admin, US-062). A
/// diferencia del catálogo público (<c>IAcademicQueryService.ListSubjectsByCareerPlanAsync</c>, que
/// no filtra por estado y no expone carga horaria/descripción), este trae activas e inactivas con
/// todos los campos de detalle. No es cross-BC: lo consume el propio módulo Academic, por eso vive
/// en el feature y no en Contracts/IAcademicQueryService.
/// </summary>
public interface IAdminSubjectReader
{
    /// <summary>Lista las materias de un plan. Orden por (year_in_plan, term_in_year, code).</summary>
    Task<IReadOnlyList<AdminSubjectListItem>> ListByCareerPlanAsync(
        CareerPlanId careerPlanId, CancellationToken ct = default);
}
