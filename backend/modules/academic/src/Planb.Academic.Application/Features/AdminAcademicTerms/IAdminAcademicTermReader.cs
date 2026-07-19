using Planb.Academic.Domain.Universities;

namespace Planb.Academic.Application.Features.AdminAcademicTerms;

/// <summary>
/// Read-side del listado de períodos lectivos de una universidad para el backoffice (admin,
/// US-064). No es cross-BC: lo consume el propio módulo Academic, por eso vive en el feature y no
/// en Contracts/IAcademicQueryService (que expone <c>ListAcademicTermsByUniversityAsync</c> para
/// el catálogo público, consumido por el form de historial de US-013).
/// </summary>
public interface IAdminAcademicTermReader
{
    /// <summary>Lista los períodos lectivos de una universidad. Orden por year desc, number desc.</summary>
    Task<IReadOnlyList<AdminAcademicTermListItem>> ListByUniversityAsync(
        UniversityId universityId, CancellationToken ct = default);
}
