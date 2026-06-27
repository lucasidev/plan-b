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

    public static readonly Error ClaimNotFound =
        Error.NotFound("identity.teacher_claim.not_found", "The claim does not exist.");

    public static readonly Error NotClaimOwner =
        Error.Forbidden(
            "identity.teacher_claim.not_owner", "You are not the owner of this claim.");

    public static readonly Error AlreadyVerified =
        Error.Conflict("identity.teacher_claim.already_verified", "This claim is already verified.");

    /// <summary>Otro user ya verificó este docente (partial UNIQUE teacher WHERE verified).</summary>
    public static readonly Error TeacherAlreadyVerifiedByAnother =
        Error.Conflict(
            "identity.teacher_claim.teacher_already_verified",
            "This teacher was already claimed and verified by someone else.");

    public static readonly Error InstitutionalEmailDomainNotAllowed =
        Error.Validation(
            "identity.teacher_claim.email_domain_not_allowed",
            "The email domain does not belong to the teacher's university. Use manual verification instead.");

    public static readonly Error VerificationTokenInvalid =
        Error.NotFound(
            "identity.teacher_claim.token_invalid", "The verification token is invalid.");

    public static readonly Error VerificationTokenInvalidated =
        Error.Conflict(
            "identity.teacher_claim.token_invalidated",
            "The verification token was superseded by a newer one.");

    public static readonly Error VerificationTokenAlreadyConsumed =
        Error.Conflict(
            "identity.teacher_claim.token_consumed", "The verification token was already used.");

    public static readonly Error VerificationTokenExpired =
        Error.Conflict("identity.teacher_claim.token_expired", "The verification token expired.");
}
