using Planb.SharedKernel.Primitives;

namespace Planb.Identity.Domain.Users;

public static class UserErrors
{
    public static readonly Error EmailRequired =
        Error.Validation("identity.email.required", "Email is required.");

    public static readonly Error EmailInvalidFormat =
        Error.Validation("identity.email.invalid_format", "Email format is invalid.");

    public static readonly Error EmailTooLong =
        Error.Validation("identity.email.too_long", "Email exceeds the 254 character limit.");

    public static readonly Error EmailAlreadyInUse =
        Error.Conflict("identity.email.already_in_use", "An account with that email already exists.");

    public static readonly Error PasswordHashRequired =
        Error.Validation("identity.password_hash.required", "Password hash is required.");

    public static readonly Error DisableReasonRequired =
        Error.Validation("identity.disable.reason_required", "A reason is required to disable a user.");

    public static readonly Error AlreadyDisabled =
        Error.Conflict("identity.disable.already_disabled", "User is already disabled.");

    public static readonly Error NotDisabled =
        Error.Conflict("identity.disable.not_disabled", "User is not currently disabled.");

    public static readonly Error VerificationTokenRequired =
        Error.Validation("identity.verification.token_required", "Token is required.");

    public static readonly Error VerificationTokenTtlMustBePositive =
        Error.Validation(
            "identity.verification.ttl_must_be_positive",
            "Token TTL must be a positive duration.");

    public static readonly Error VerificationTokenInvalid =
        Error.NotFound("identity.verification.invalid", "Verification token is invalid.");

    public static readonly Error VerificationTokenExpired =
        Error.Conflict("identity.verification.expired", "Verification token has expired.");

    public static readonly Error VerificationTokenAlreadyConsumed =
        Error.Conflict(
            "identity.verification.already_consumed",
            "Verification token has already been consumed.");

    public static readonly Error VerificationTokenInvalidated =
        Error.Conflict(
            "identity.verification.invalidated",
            "Verification token has been invalidated.");

    public static readonly Error VerificationWrongPurpose =
        Error.Conflict(
            "identity.verification.wrong_purpose",
            "Verification token is for a different purpose.");

    public static readonly Error PasswordTooWeak =
        Error.Validation(
            "identity.password.too_weak",
            "Password must be at least 12 characters long.");

    /// <summary>
    /// Generic authentication failure. Returned both when the email isn't registered
    /// and when the password doesn't match — anti-enumeration. The frontend never
    /// distinguishes between the two.
    /// </summary>
    public static readonly Error InvalidCredentials =
        Error.Unauthorized(
            "identity.signin.invalid_credentials",
            "Email or password is incorrect.");

    public static readonly Error EmailNotVerified =
        Error.Forbidden(
            "identity.account.email_not_verified",
            "Account email has not been verified.");

    public static readonly Error AccountDisabled =
        Error.Forbidden(
            "identity.account.disabled",
            "Account has been disabled.");

    /// <summary>
    /// La transición a expired solo aplica a registros sin verificar. Si el user ya está
    /// verificado, ya está expirado o está disabled, este error se levanta (idempotencia
    /// explícita en el handler del scheduled job — un registro que dejó de ser candidato entre
    /// la query y el update no rompe la corrida).
    /// </summary>
    public static readonly Error NotEligibleForExpiration =
        Error.Conflict(
            "identity.account.not_eligible_for_expiration",
            "User is not eligible for unverified expiration.");

    // -- StudentProfile (US-012) --------------------------------------------------

    /// <summary>
    /// Solo users con role=Member pueden tener StudentProfiles. Staff (moderator/admin/
    /// university_staff) operan el catálogo pero no son alumnos del mismo (ADR-0008).
    /// </summary>
    public static readonly Error OnlyMembersCanHaveProfiles =
        Error.Conflict(
            "identity.student_profile.only_members",
            "Only users with role=Member can create student profiles.");

    public static readonly Error EnrollmentYearOutOfRange =
        Error.Validation(
            "identity.student_profile.enrollment_year_out_of_range",
            "Enrollment year must be between 2010 and the current year.");

    /// <summary>
    /// Un user solo puede tener un StudentProfile activo por carrera. Si quiere cambiar el plan
    /// de la misma carrera, primero deberá deactivar el activo (path de deactivación todavía
    /// no implementado).
    /// </summary>
    public static readonly Error DuplicateStudentProfile =
        Error.Conflict(
            "identity.student_profile.duplicate_for_career",
            "User already has an active student profile for that career.");

    /// <summary>
    /// User no encontrado por Id. Llega al handler solo si el JWT fue válido pero el user fue
    /// borrado mid-session (estado degenerado). Mapea a 404, distinto de InvalidCredentials que
    /// mapea a 401 anti-enum.
    /// </summary>
    public static readonly Error NotFoundById =
        Error.NotFound(
            "identity.user.not_found",
            "User not found.");

    /// <summary>
    /// El CareerPlanId pasado al CreateStudentProfile no existe en Academic. Identity expone
    /// su propio error para no acoplarse a CareerPlanErrors (Academic.Domain): el handler
    /// resuelve la ausencia via IAcademicQueryService (cross-BC read, ADR-0017) y traduce a un
    /// código del namespace Identity.
    /// </summary>
    public static readonly Error StudentProfileCareerPlanNotFound =
        Error.NotFound(
            "identity.student_profile.career_plan_not_found",
            "Career plan referenced by the student profile was not found in the academic catalog.");
}
