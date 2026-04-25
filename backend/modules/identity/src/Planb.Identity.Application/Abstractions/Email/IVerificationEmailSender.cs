using Planb.Identity.Domain.Users;

namespace Planb.Identity.Application.Abstractions.Email;

/// <summary>
/// Port for sending email-verification messages. The implementation owns transport (SMTP, SES, etc.)
/// and template rendering. The application layer just supplies the recipient and verification token.
/// </summary>
public interface IVerificationEmailSender
{
    Task SendAsync(EmailAddress recipient, string token, CancellationToken ct = default);
}
