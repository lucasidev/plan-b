using Planb.Academic.Domain.Subjects;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.Prerequisites;

/// <summary>
/// Correlativa entre dos materias del mismo plan: <see cref="SubjectId"/> requiere a
/// <see cref="RequiredSubjectId"/> según el <see cref="Type"/> (ADR-0003).
///
/// <para>
/// No hereda de <c>Entity&lt;TId&gt;</c> a propósito: una correlativa no tiene identidad propia,
/// <em>es</em> la tripla. El data-model define <c>PRIMARY KEY (subject_id, required_subject_id,
/// type)</c>, que además permite que la misma pareja aparezca en los dos grafos.
/// </para>
///
/// <para>
/// Dos invariantes NO se validan acá porque necesitan contexto que la entidad no tiene: que ambas
/// materias sean del mismo plan (lo chequea el handler contra el query service) y que la arista no
/// cierre un ciclo (lo chequea <see cref="IPrerequisiteGraphValidator"/>, que necesita el grafo
/// entero). Acá solo vive lo que se puede decidir con la tripla sola.
/// </para>
/// </summary>
public sealed class Prerequisite
{
    public SubjectId SubjectId { get; private set; }
    public SubjectId RequiredSubjectId { get; private set; }
    public PrerequisiteType Type { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }

    private Prerequisite() { }

    public static Result<Prerequisite> Create(
        SubjectId subjectId,
        SubjectId requiredSubjectId,
        PrerequisiteType type,
        DateTimeOffset createdAt)
    {
        // CHECK del data-model: subject_id != required_subject_id. Lo duplicamos acá para que el
        // Result tenga el motivo claro en vez de reventar contra el constraint.
        if (subjectId == requiredSubjectId)
        {
            return PrerequisiteErrors.SelfReference;
        }

        return new Prerequisite
        {
            SubjectId = subjectId,
            RequiredSubjectId = requiredSubjectId,
            Type = type,
            CreatedAt = createdAt,
        };
    }

    /// <summary>Reconstitución para EF / seeder, sin validar (mismo contract que Subject.Hydrate).</summary>
    public static Prerequisite Hydrate(
        SubjectId subjectId,
        SubjectId requiredSubjectId,
        PrerequisiteType type,
        DateTimeOffset createdAt) =>
        new()
        {
            SubjectId = subjectId,
            RequiredSubjectId = requiredSubjectId,
            Type = type,
            CreatedAt = createdAt,
        };
}
