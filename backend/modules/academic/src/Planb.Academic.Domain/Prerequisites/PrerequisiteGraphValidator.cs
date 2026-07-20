using Planb.Academic.Domain.Subjects;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.Prerequisites;

/// <summary>
/// Detección de ciclos por alcanzabilidad (ADR-0003). Sin I/O: el caller trae el grafo del plan y
/// esto decide.
///
/// <para>
/// La arista significa "subject requiere required". Agregar <c>S → R</c> cierra un ciclo si y solo
/// si desde <c>R</c> ya se llega a <c>S</c> siguiendo aristas del mismo type. Con el grafo previo
/// acíclico (invariante que mantenemos rechazando cada arista que lo rompe), ese único chequeo de
/// alcanzabilidad alcanza: no hace falta recorrer el grafo entero buscando ciclos preexistentes.
/// </para>
/// </summary>
public sealed class PrerequisiteGraphValidator : IPrerequisiteGraphValidator
{
    public Result ValidateNewEdge(
        SubjectId subjectId,
        SubjectId requiredSubjectId,
        PrerequisiteType type,
        IReadOnlyCollection<Prerequisite> existingInPlan)
    {
        ArgumentNullException.ThrowIfNull(existingInPlan);

        if (subjectId == requiredSubjectId)
        {
            return PrerequisiteErrors.SelfReference;
        }

        var adjacency = BuildAdjacency(existingInPlan, type);

        return CanReach(from: requiredSubjectId, target: subjectId, adjacency)
            ? PrerequisiteErrors.CycleDetected
            : Result.Success();
    }

    private static Dictionary<SubjectId, List<SubjectId>> BuildAdjacency(
        IReadOnlyCollection<Prerequisite> prerequisites,
        PrerequisiteType type)
    {
        var adjacency = new Dictionary<SubjectId, List<SubjectId>>();

        foreach (var edge in prerequisites)
        {
            if (edge.Type != type)
            {
                continue;
            }

            if (!adjacency.TryGetValue(edge.SubjectId, out var targets))
            {
                targets = [];
                adjacency[edge.SubjectId] = targets;
            }

            targets.Add(edge.RequiredSubjectId);
        }

        return adjacency;
    }

    /// <summary>
    /// DFS iterativo (no recursivo: un plan patológico con una cadena muy larga no debería poder
    /// tirar el stack). El <c>visited</c> corta la re-exploración, así que el costo es O(V + E).
    /// </summary>
    private static bool CanReach(
        SubjectId from,
        SubjectId target,
        Dictionary<SubjectId, List<SubjectId>> adjacency)
    {
        var visited = new HashSet<SubjectId>();
        var pending = new Stack<SubjectId>();
        pending.Push(from);

        while (pending.Count > 0)
        {
            var current = pending.Pop();

            if (current == target)
            {
                return true;
            }

            if (!visited.Add(current))
            {
                continue;
            }

            if (!adjacency.TryGetValue(current, out var neighbours))
            {
                continue;
            }

            foreach (var neighbour in neighbours)
            {
                if (!visited.Contains(neighbour))
                {
                    pending.Push(neighbour);
                }
            }
        }

        return false;
    }
}
