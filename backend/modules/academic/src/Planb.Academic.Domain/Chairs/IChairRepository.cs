using Planb.Academic.Domain.Subjects;

namespace Planb.Academic.Domain.Chairs;

/// <summary>
/// Write-side del aggregate <see cref="Chair"/> (US-196). Los reads públicos (las cátedras que
/// Reseñar ofrece, la ficha) van por <c>IAcademicQueryService</c> con Dapper; este repo es solo para
/// cargar el aggregate a mutar, con su equipo eager. El SaveChanges lo hace el
/// <c>IAcademicUnitOfWork</c>.
/// </summary>
public interface IChairRepository
{
    Task AddAsync(Chair chair, CancellationToken ct = default);

    /// <summary>Carga el aggregate por id para editar, archivar o reactivar. Null si no existe.</summary>
    Task<Chair?> GetByIdAsync(ChairId id, CancellationToken ct = default);

    /// <summary>
    /// True si ya existe una cátedra con ese (subject_id, name). Refleja el UNIQUE de DB.
    /// <paramref name="excludeId"/> ignora la propia fila al validar un rename.
    /// </summary>
    Task<bool> ExistsByNameAsync(
        SubjectId subjectId,
        string name,
        ChairId? excludeId,
        CancellationToken ct = default);

    /// <summary>
    /// Las cátedras de una materia, activas y archivadas, con su equipo. La usa el backoffice para
    /// listarlas y el alta para validar el nombre contra las que ya existen.
    /// </summary>
    Task<IReadOnlyList<Chair>> GetBySubjectAsync(SubjectId subjectId, CancellationToken ct = default);
}
