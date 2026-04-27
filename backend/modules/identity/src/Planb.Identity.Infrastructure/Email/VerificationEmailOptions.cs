using System.ComponentModel.DataAnnotations;

namespace Planb.Identity.Infrastructure.Email;

/// <summary>
/// Knobs that shape the verification link in the outgoing email. Bound from
/// <c>Identity:Verification</c>. Default is intentionally empty so any environment
/// that forgets to override fails fast at startup (validated via
/// <c>ValidateDataAnnotations().ValidateOnStart()</c>). Dev value lives in
/// <c>appsettings.Development.json</c>; prod value comes from env vars.
/// </summary>
public sealed class VerificationEmailOptions
{
    public const string SectionName = "Identity:Verification";

    /// <summary>
    /// Base URL used to build the verification link. Tokens are appended as a query parameter.
    /// Example: <c>http://localhost:3000/verify-email</c> in dev.
    /// </summary>
    [Required]
    [Url]
    public string LinkBaseUrl { get; init; } = string.Empty;
}
