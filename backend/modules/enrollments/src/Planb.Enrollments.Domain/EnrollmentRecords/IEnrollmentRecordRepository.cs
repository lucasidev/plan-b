namespace Planb.Enrollments.Domain.EnrollmentRecords;

/// <summary>
/// Repo del aggregate. Mantiene la interface mínima: add + existence check para idempotencia
/// del create.
///
/// Cuando US-015 (editar entrada del historial) aterrice, agregar <c>GetByIdAsync</c> y
/// <c>UpdateAsync</c>. Read complejo (listar historial de un student) va por Dapper en
/// <c>IEnrollmentReadService</c>, no por acá (ADR-0018).
/// </summary>
public interface IEnrollmentRecordRepository
{
    /// <summary>Agrega el aggregate. SaveChanges lo hace el middleware Wolverine.</summary>
    Task AddAsync(EnrollmentRecord record, CancellationToken ct = default);

    /// <summary>
    /// True si ya existe un record con la triple (student, subject, term). Caller: handler del
    /// register para devolver 409 idempotente en lugar de explotar contra el UNIQUE constraint.
    /// </summary>
    Task<bool> ExistsAsync(
        Guid studentProfileId, Guid subjectId, Guid? termId, CancellationToken ct = default);
}
