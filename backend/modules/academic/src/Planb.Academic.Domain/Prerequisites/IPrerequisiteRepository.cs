using Planb.Academic.Domain.CareerPlans;
using Planb.Academic.Domain.Subjects;

namespace Planb.Academic.Domain.Prerequisites;

/// <summary>
/// Repo de correlativas (US-062). El grafo se lee entero por plan porque el validator de
/// aciclicidad lo necesita completo (ADR-0003); una materia sola no alcanza para decidir.
/// </summary>
public interface IPrerequisiteRepository
{
    Task AddAsync(Prerequisite prerequisite, CancellationToken ct = default);

    void Remove(Prerequisite prerequisite);

    /// <summary>
    /// Todas las correlativas del plan (los dos types juntos; el validator filtra). Resuelve el
    /// plan por join con subjects: la tabla de correlativas no lleva career_plan_id propio para no
    /// desnormalizar un dato que ya vive en la materia.
    /// </summary>
    Task<IReadOnlyList<Prerequisite>> GetByPlanAsync(CareerPlanId careerPlanId, CancellationToken ct = default);

    Task<Prerequisite?> FindAsync(
        SubjectId subjectId,
        SubjectId requiredSubjectId,
        PrerequisiteType type,
        CancellationToken ct = default);

    /// <summary>
    /// Correlativas que apuntan a esta materia, o sea las materias que la necesitan. Es lo que
    /// bloquea el soft delete con 409 <c>has_dependents</c>.
    /// </summary>
    Task<IReadOnlyList<Prerequisite>> GetDependentsAsync(SubjectId requiredSubjectId, CancellationToken ct = default);
}
