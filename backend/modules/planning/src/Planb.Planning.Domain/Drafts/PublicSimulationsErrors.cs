using Planb.SharedKernel.Primitives;

namespace Planb.Planning.Domain.Drafts;

/// <summary>Errores del feed público de simulaciones compartidas (US-027).</summary>
public static class PublicSimulationsErrors
{
    /// <summary>
    /// El <c>careerPlanId</c> pedido no es el del <c>StudentProfile</c> del caller. 403 (no 400 ni
    /// 404): el feed existe, lo que se rechaza es mirar el corpus de una carrera ajena. El AC de
    /// US-027 lo pide explícito ("no leakea cross-carrera").
    /// </summary>
    public static readonly Error PlanMismatch =
        Error.Forbidden(
            "planning.public_simulations.plan_mismatch",
            "The requested career plan does not match the student's career plan.");

    /// <summary>
    /// El cursor de paginación no decodifica a un (sharedAt, id) válido: corrupto o manipulado. El
    /// cliente nunca lo construye a mano, solo reenvía el <c>nextCursor</c> que ya recibió. 400.
    /// </summary>
    public static readonly Error InvalidCursor =
        Error.Validation(
            "planning.public_simulations.invalid_cursor",
            "The pagination cursor is not valid.");
}
