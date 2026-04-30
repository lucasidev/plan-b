using System.ComponentModel.DataAnnotations;

namespace Planb.Identity.Infrastructure.Email;

/// <summary>
/// Knobs that shape the password-reset link. Bound from <c>Identity:PasswordReset</c>.
/// Distinct from <see cref="VerificationEmailOptions"/> because the destination URL is
/// different: verification points at <c>/verify-email</c>, reset points at
/// <c>/reset-password</c>. Keeping them separated avoids the temptation to "reuse"
/// the verification base URL and end up with a wrong link in production.
/// </summary>
public sealed class PasswordResetEmailOptions
{
    public const string SectionName = "Identity:PasswordReset";

    /// <summary>
    /// Base URL for the password-reset link. The raw token is appended as a query string
    /// parameter. Example: <c>http://localhost:3000/reset-password</c> in dev.
    /// </summary>
    [Required]
    [Url]
    public string LinkBaseUrl { get; init; } = string.Empty;
}
