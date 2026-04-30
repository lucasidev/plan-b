using Planb.Identity.Domain.Users;

namespace Planb.Identity.Application.Abstractions.Email;

/// <summary>
/// Port for sending identity-flow emails (account verification, password reset). The
/// implementation owns transport (SMTP, SES, etc.) and template rendering. The application
/// layer just supplies the recipient and the raw token; the implementation embeds it in the
/// outgoing link.
/// </summary>
public interface IVerificationEmailSender
{
    /// <summary>
    /// Sends the email-verification message used after registration. The token must be the
    /// raw value the user clicks on; the link the recipient sees points to the frontend's
    /// verify-email page.
    /// </summary>
    Task SendAsync(EmailAddress recipient, string token, CancellationToken ct = default);

    /// <summary>
    /// Sends the password-reset message. The link points to the frontend's reset-password
    /// page with the raw token in the query string. Distinct method (vs. an enum-flavoured
    /// <c>SendAsync</c>) because the templates and base URLs are independent and inlining
    /// branching at the call site is clearer than an opaque enum parameter.
    /// </summary>
    Task SendPasswordResetAsync(EmailAddress recipient, string token, CancellationToken ct = default);
}
