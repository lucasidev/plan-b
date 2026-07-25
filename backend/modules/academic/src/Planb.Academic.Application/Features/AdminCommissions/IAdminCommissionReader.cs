namespace Planb.Academic.Application.Features.AdminCommissions;

/// <summary>
/// Read-side de los listados admin de comisiones para el backoffice (US-093 y cont.). A diferencia
/// del catálogo público (<c>IAcademicQueryService.ListCommissionsBySubjectAndTermAsync</c>, que solo
/// trae comisiones activas y no expone el horario), estos listados traen activas e inactivas junto
/// con docentes y horario completos. No es cross-BC: lo consume el propio módulo Academic, por eso
/// vive en el feature y no en Contracts/IAcademicQueryService.
/// </summary>
public interface IAdminCommissionReader
{
    /// <summary>Lista las comisiones de una materia en un cuatrimestre. Orden por nombre.</summary>
    Task<IReadOnlyList<AdminCommissionListItem>> ListBySubjectAndTermAsync(
        Guid subjectId, Guid termId, CancellationToken ct = default);

    /// <summary>
    /// Lista las comisiones de TODAS las materias de un cuatrimestre (pantalla "Comisiones · cuatri").
    /// Orden por nombre de materia y, dentro de esa, por nombre de comisión.
    /// </summary>
    Task<IReadOnlyList<TermCommissionListItem>> ListByTermAsync(
        Guid termId, CancellationToken ct = default);
}
