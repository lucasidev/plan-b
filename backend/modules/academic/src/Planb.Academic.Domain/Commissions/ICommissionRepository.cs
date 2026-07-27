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

    /// <summary>
    /// True si existe alguna Commission (activa o archivada) para ese período lectivo.
    ///
    /// <para>
    /// La usa el update del período para no dejar cambiar su <c>Kind</c> una vez que hay comisiones
    /// colgando: al crearlas se validó que la cadencia de la materia coincidiera con la del período
    /// (<c>CommissionErrors.TermKindMismatch</c>), y editar el período después rompía esa igualdad
    /// sin que nada la volviera a mirar. Cuenta las archivadas a propósito: siguen siendo el
    /// registro de lo que se dictó, y su cadencia tiene que seguir describiendo la realidad.
    /// </para>
    /// </summary>
    Task<bool> ExistsForTermAsync(Guid termId, CancellationToken ct = default);

    /// <summary>
    /// True si existe alguna Commission (activa o archivada) para esa materia. Contraparte de
    /// <see cref="ExistsForTermAsync"/> del otro lado de la misma igualdad: el update de la materia
    /// tampoco puede cambiarle el <c>TermKind</c> si ya tiene comisiones dictándose.
    /// </summary>
    Task<bool> ExistsForSubjectAsync(Guid subjectId, CancellationToken ct = default);
}
