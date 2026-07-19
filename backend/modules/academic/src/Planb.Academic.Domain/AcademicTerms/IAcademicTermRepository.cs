using Planb.Academic.Domain.Universities;

namespace Planb.Academic.Domain.AcademicTerms;

/// <summary>
/// Repo del aggregate AcademicTerm. US-064 suma el write-side (Add + read-por-id + check de
/// unicidad) para el CRUD admin. Los reads de listado del backoffice van por el reader Dapper;
/// el listado público (US-013) va por <c>IAcademicQueryService.ListAcademicTermsByUniversityAsync</c>.
/// </summary>
public interface IAcademicTermRepository
{
    Task AddAsync(AcademicTerm term, CancellationToken ct = default);

    /// <summary>Carga el aggregate por id para editar. Null si no existe.</summary>
    Task<AcademicTerm?> FindByIdAsync(AcademicTermId id, CancellationToken ct = default);

    /// <summary>
    /// True si ya existe un AcademicTerm con ese (university, year, number, kind). Refleja el
    /// UNIQUE de DB. <paramref name="excludeId"/> ignora la propia fila al validar un Update.
    /// </summary>
    Task<bool> ExistsAsync(
        UniversityId universityId,
        int year,
        int number,
        TermKind kind,
        AcademicTermId? excludeId,
        CancellationToken ct = default);
}
