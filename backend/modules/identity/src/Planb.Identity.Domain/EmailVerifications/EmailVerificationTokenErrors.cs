using Planb.SharedKernel.Primitives;

namespace Planb.Identity.Domain.EmailVerifications;

public static class EmailVerificationTokenErrors
{
    public static readonly Error TokenRequired =
        Error.Validation("identity.verification.token_required", "Token is required.");

    public static readonly Error TtlMustBePositive =
        Error.Validation(
            "identity.verification.ttl_must_be_positive",
            "Token TTL must be a positive duration.");

    public static readonly Error AlreadyConsumed =
        Error.Conflict("identity.verification.already_consumed", "Token has already been consumed.");

    public static readonly Error Expired =
        Error.Conflict("identity.verification.expired", "Token has expired.");

    public static readonly Error NotFound =
        Error.NotFound("identity.verification.not_found", "Verification token was not found.");
}
