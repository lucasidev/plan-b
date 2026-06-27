using Planb.SharedKernel.Primitives;

namespace Planb.Identity.Domain.TeacherProfiles;

/// <summary>Errores de negocio del flow de claim / verificación docente (US-030+).</summary>
public static class TeacherProfileErrors
{
    public static readonly Error TeacherNotFound =
        Error.NotFound(
            "identity.teacher_claim.teacher_not_found",
            "The teacher being claimed does not exist in the catalog.");

    /// <summary>
    /// El docente fue dado de baja (soft delete) del catálogo entre que la UI lo mostró y el submit
    /// del claim. El endpoint mapea este código a 410 Gone (mismo título que la página de docente,
    /// US-003/US-030 AC), no a 404: el recurso existió pero ya no figura.
    /// </summary>
    public static readonly Error TeacherRemoved =
        Error.NotFound(
            "academic.teacher.removed",
            "The teacher is no longer in the catalog.");

    public static readonly Error AlreadyClaimed =
        Error.Conflict(
            "identity.teacher_claim.already_claimed",
            "You already have a claim on this teacher.");
}
