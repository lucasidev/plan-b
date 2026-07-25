namespace Planb.Academic.Domain.Commissions;

/// <summary>
/// Write-side del aggregate <see cref="Commission"/> (US-093, admin CRUD). Los reads del catálogo
/// público van por <c>IAcademicQueryService</c> (Dapper); este repo es solo para cargar el aggregate
/// a mutar (con Teachers/Schedules eager, AutoInclude) y agregarlo. El SaveChanges lo hace el
/// <c>IAcademicUnitOfWork</c>.
/// </summary>
public interface ICommissionRepository
{
    Task AddAsync(Commission commission, CancellationToken ct = default);

    /// <summary>Carga el aggregate por id para editar/desactivar/reactivar. Null si no existe.</summary>
    Task<Commission?> GetByIdAsync(CommissionId id, CancellationToken ct = default);

    /// <summary>
    /// True si ya existe una Commission con ese (subject_id, term_id, name). Refleja el UNIQUE de DB
    /// (ux_commissions_subject_term_name). <paramref name="excludeId"/> ignora la propia fila al
    /// validar un Update (mismo patrón que ISubjectRepository.ExistsByCodeAsync).
    /// </summary>
    Task<bool> ExistsByNameAsync(
        Guid subjectId,
        Guid termId,
        string name,
        CommissionId? excludeId,
        CancellationToken ct = default);
}
