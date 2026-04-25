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
}
