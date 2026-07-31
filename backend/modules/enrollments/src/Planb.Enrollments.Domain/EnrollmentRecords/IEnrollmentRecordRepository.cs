namespace Planb.Enrollments.Domain.EnrollmentRecords;

/// <summary>
/// Repo del aggregate. Mantiene la interface mínima: add, existence check para idempotencia del
/// create, y el get por id que necesita la edición (US-015).
///
/// No hay <c>UpdateAsync</c>: el aggregate que devuelve <see cref="GetByIdAsync"/> viene trackeado,
/// así que mutarlo y dejar que el middleware Wolverine haga el SaveChanges alcanza. Un método de
/// update sería ceremonia que además invitaría a llamarlo con una instancia detached.
///
/// Read complejo (listar historial de un student) va por Dapper en <c>IEnrollmentReadService</c>,
/// no por acá (ADR-0018).
/// </summary>
public interface IEnrollmentRecordRepository
{
    /// <summary>Agrega el aggregate. SaveChanges lo hace el middleware Wolverine.</summary>
    Task AddAsync(EnrollmentRecord record, CancellationToken ct = default);

    /// <summary>
    /// El aggregate por id, trackeado para que las mutaciones del caller se persistan. Devuelve
    /// null si no existe: el caller decide si eso es 404 o algo más.
    /// </summary>
    Task<EnrollmentRecord?> GetByIdAsync(
        EnrollmentRecordId id, CancellationToken ct = default);

    /// <summary>
    /// True si ya existe un record con la triple (student, subject, term). Caller: handler del
    /// register para devolver 409 idempotente en lugar de explotar contra el UNIQUE constraint.
    /// </summary>
    Task<bool> ExistsAsync(
        Guid studentProfileId, Guid subjectId, Guid? termId, CancellationToken ct = default);
}
