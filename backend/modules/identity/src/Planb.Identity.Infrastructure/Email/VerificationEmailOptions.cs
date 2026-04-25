namespace Planb.Identity.Infrastructure.Email;

/// <summary>
/// Knobs that shape the verification link in the outgoing email. Bound from <c>Identity:Verification</c>.
/// </summary>
public sealed class VerificationEmailOptions
{
    public const string SectionName = "Identity:Verification";

    /// <summary>
    /// Base URL used to build the verification link. Tokens are appended as a query parameter.
    /// Example: <c>https://planb.local/verify-email</c>.
    /// </summary>
    public string LinkBaseUrl { get; init; } = "https://planb.local/verify-email";
}
