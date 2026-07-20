using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.Prerequisites;

public static class PrerequisiteErrors
{
    public static readonly Error SelfReference =
        Error.Validation(
            "academic.prerequisite.self_reference",
            "A subject cannot be its own prerequisite.");

    /// <summary>
    /// La arista propuesta cierra un ciclo en el grafo de ese type. Es el motivo por el que existe
    /// el domain service: la FK previene el self-loop, pero A → B → C → A necesita DFS (ADR-0003).
    /// </summary>
    public static readonly Error CycleDetected =
        Error.Conflict(
            "academic.prerequisite.cycle_detected",
            "Adding this prerequisite would create a cycle in the graph for this type.");

    /// <summary>Invariante del data-model: ambas materias tienen que ser del mismo career_plan.</summary>
    public static readonly Error CrossPlan =
        Error.Validation(
            "academic.prerequisite.cross_plan",
            "Both subjects must belong to the same career plan.");

    public static readonly Error AlreadyExists =
        Error.Conflict(
            "academic.prerequisite.already_exists",
            "This prerequisite already exists for this type.");

    public static readonly Error NotFound =
        Error.NotFound(
            "academic.prerequisite.not_found",
            "Prerequisite not found.");
}
