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
}
