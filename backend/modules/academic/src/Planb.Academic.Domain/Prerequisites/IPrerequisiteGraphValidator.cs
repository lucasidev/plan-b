using Planb.Academic.Domain.Subjects;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.Prerequisites;

/// <summary>
/// Domain service que decide si una correlativa nueva mantiene acíclico el grafo de su type
/// (ADR-0003). Vive como servicio y no como método de <see cref="Prerequisite"/> porque la
/// decisión necesita el grafo entero del plan, que una arista sola no conoce.
/// </summary>
public interface IPrerequisiteGraphValidator
{
    /// <summary>
    /// Valida que agregar <paramref name="subjectId"/> → <paramref name="requiredSubjectId"/> en el
    /// grafo de <paramref name="type"/> no cierre un ciclo.
    /// </summary>
    /// <param name="existingInPlan">
    /// Todas las correlativas del plan. El validator filtra por type: cada type es un DAG separado,
    /// así que un ciclo en <c>para_cursar</c> no dice nada del grafo de <c>para_rendir</c>.
    /// </param>
    Result ValidateNewEdge(
        SubjectId subjectId,
        SubjectId requiredSubjectId,
        PrerequisiteType type,
        IReadOnlyCollection<Prerequisite> existingInPlan);
}
