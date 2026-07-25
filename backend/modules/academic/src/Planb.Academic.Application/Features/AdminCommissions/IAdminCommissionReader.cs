namespace Planb.Academic.Application.Features.AdminCommissions;

/// <summary>
/// Read-side del listado de comisiones de una materia+término para el backoffice (admin, US-093). A
/// diferencia del catálogo público (<c>IAcademicQueryService.ListCommissionsBySubjectAndTermAsync</c>,
/// que solo trae comisiones activas y no expone el horario), este trae activas e inactivas junto con
/// docentes y horario completos. No es cross-BC: lo consume el propio módulo Academic, por eso vive
/// en el feature y no en Contracts/IAcademicQueryService.
/// </summary>
public interface IAdminCommissionReader
{
    /// <summary>Lista las comisiones de una materia en un cuatrimestre. Orden por nombre.</summary>
    Task<IReadOnlyList<AdminCommissionListItem>> ListBySubjectAndTermAsync(
        Guid subjectId, Guid termId, CancellationToken ct = default);
}
