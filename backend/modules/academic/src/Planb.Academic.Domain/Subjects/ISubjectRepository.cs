using Planb.Academic.Domain.CareerPlans;

namespace Planb.Academic.Domain.Subjects;

/// <summary>
/// Repo de Subject. US-088 lo usa para Add en bloque al materializar el import. La lectura
/// existente sigue via DapperAcademicQueryService.
/// </summary>
public interface ISubjectRepository
{
    Task AddRangeAsync(IEnumerable<Subject> subjects, CancellationToken ct = default);

    /// <summary>Alta unitaria del backoffice (US-062).</summary>
    Task AddAsync(Subject subject, CancellationToken ct = default);

    /// <summary>
    /// Trae la materia trackeada para poder mutarla (Update / Deactivate / Reactivate). Devuelve
    /// null si no existe.
    /// </summary>
    Task<Subject?> GetByIdAsync(SubjectId id, CancellationToken ct = default);

    /// <summary>
    /// True si ya existe una Subject con ese (career_plan, code). Refleja el UNIQUE de DB
    /// (ux_subjects_plan_code). <paramref name="excludeId"/> ignora la propia fila al validar un
    /// Update (US-062, mismo patrón que ICareerRepository.ExistsByCodeAsync).
    /// </summary>
    Task<bool> ExistsByCodeAsync(
        CareerPlanId careerPlanId, string code, SubjectId? excludeId, CancellationToken ct = default);
}
