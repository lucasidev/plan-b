using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using Planb.Identity.Application.Abstractions.Email;
using Planb.Identity.Domain.Users;

namespace Planb.Identity.Infrastructure.Email;

/// <summary>
/// SMTP adapter using MailKit. In dev this points at MailHog (no auth, no SSL). In production
/// it points at a real relay with credentials in <see cref="SmtpOptions"/>.
/// </summary>
public sealed class SmtpVerificationEmailSender : IVerificationEmailSender
{
    private readonly SmtpOptions _smtp;
    private readonly VerificationEmailOptions _verification;
    private readonly ILogger<SmtpVerificationEmailSender> _logger;

    public SmtpVerificationEmailSender(
        IOptions<SmtpOptions> smtp,
        IOptions<VerificationEmailOptions> verification,
        ILogger<SmtpVerificationEmailSender> logger)
    {
        _smtp = smtp.Value;
        _verification = verification.Value;
        _logger = logger;
    }

    public async Task SendAsync(EmailAddress recipient, string token, CancellationToken ct = default)
    {
        var link = $"{_verification.LinkBaseUrl}?token={Uri.EscapeDataString(token)}";

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_smtp.FromName, _smtp.FromEmail));
        message.To.Add(MailboxAddress.Parse(recipient.Value));
        message.Subject = "Confirmá tu cuenta en planb";

        var body = new BodyBuilder
        {
            HtmlBody = $"""
                <p>Hola,</p>
                <p>Para activar tu cuenta en <strong>planb</strong>, hacé click acá:</p>
                <p><a href="{link}">Confirmar mi email</a></p>
                <p>El link expira en 24 horas. Si no fuiste vos, ignorá este mensaje.</p>
                """,
            TextBody = $"""
                Hola,

                Para activar tu cuenta en planb, abrí este link:
                {link}

                El link expira en 24 horas. Si no fuiste vos, ignorá este mensaje.
                """,
        };
        message.Body = body.ToMessageBody();

        using var client = new SmtpClient();
        var socketOptions = _smtp.UseSsl
            ? SecureSocketOptions.StartTlsWhenAvailable
            : SecureSocketOptions.None;

        await client.ConnectAsync(_smtp.Host, _smtp.Port, socketOptions, ct);
        if (!string.IsNullOrEmpty(_smtp.Username))
        {
            await client.AuthenticateAsync(_smtp.Username, _smtp.Password ?? string.Empty, ct);
        }
        await client.SendAsync(message, ct);
        await client.DisconnectAsync(quit: true, ct);

        _logger.LogInformation(
            "Verification email sent to {Recipient}", recipient.Value);
    }
}
