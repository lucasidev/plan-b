using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using Planb.Identity.Application.Abstractions.Email;
using Planb.Identity.Domain.Users;

namespace Planb.Identity.Infrastructure.Email;

/// <summary>
/// SMTP adapter using MailKit. In dev and CI this points at Mailpit (no auth, no SSL). In
/// production it points at a real relay with credentials in <see cref="SmtpOptions"/>.
///
/// One adapter for both verification and password-reset emails: the transport is identical,
/// only the subject, body, and link base differ. Keeping a single class avoids duplicating
/// the connect/auth/disconnect dance.
/// </summary>
public sealed class SmtpVerificationEmailSender : IVerificationEmailSender
{
    private readonly SmtpOptions _smtp;
    private readonly VerificationEmailOptions _verification;
    private readonly PasswordResetEmailOptions _passwordReset;
    private readonly ILogger<SmtpVerificationEmailSender> _logger;

    public SmtpVerificationEmailSender(
        IOptions<SmtpOptions> smtp,
        IOptions<VerificationEmailOptions> verification,
        IOptions<PasswordResetEmailOptions> passwordReset,
        ILogger<SmtpVerificationEmailSender> logger)
    {
        _smtp = smtp.Value;
        _verification = verification.Value;
        _passwordReset = passwordReset.Value;
        _logger = logger;
    }

    public async Task SendAsync(EmailAddress recipient, string token, CancellationToken ct = default)
    {
        var link = $"{_verification.LinkBaseUrl}?token={Uri.EscapeDataString(token)}";

        var message = BuildMessage(
            recipient,
            subject: "Confirmá tu cuenta en planb",
            htmlBody: $"""
                <p>Hola,</p>
                <p>Para activar tu cuenta en <strong>planb</strong>, hacé click acá:</p>
                <p><a href="{link}">Confirmar mi email</a></p>
                <p>El link expira en 24 horas. Si no fuiste vos, ignorá este mensaje.</p>
                """,
            textBody: $"""
                Hola,

                Para activar tu cuenta en planb, abrí este link:
                {link}

                El link expira en 24 horas. Si no fuiste vos, ignorá este mensaje.
                """);

        await SendMessageAsync(message, ct);
        _logger.LogInformation("Verification email sent to {Recipient}", recipient.Value);
    }

    public async Task SendPasswordResetAsync(
        EmailAddress recipient, string token, CancellationToken ct = default)
    {
        var link = $"{_passwordReset.LinkBaseUrl}?token={Uri.EscapeDataString(token)}";

        var message = BuildMessage(
            recipient,
            subject: "Recuperá tu contraseña en planb",
            htmlBody: $"""
                <p>Hola,</p>
                <p>Pediste cambiar tu contraseña en <strong>planb</strong>. Hacé click acá para elegir una nueva:</p>
                <p><a href="{link}">Elegir contraseña nueva</a></p>
                <p>El link expira en 30 minutos y se puede usar una sola vez.</p>
                <p>Si no fuiste vos, ignorá este mensaje. Tu contraseña actual sigue siendo válida.</p>
                """,
            textBody: $"""
                Hola,

                Pediste cambiar tu contraseña en planb. Abrí este link para elegir una nueva:
                {link}

                El link expira en 30 minutos y se puede usar una sola vez.

                Si no fuiste vos, ignorá este mensaje. Tu contraseña actual sigue siendo válida.
                """);

        await SendMessageAsync(message, ct);
        _logger.LogInformation("Password-reset email sent to {Recipient}", recipient.Value);
    }

    private MimeMessage BuildMessage(EmailAddress recipient, string subject, string htmlBody, string textBody)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_smtp.FromName, _smtp.FromEmail));
        message.To.Add(MailboxAddress.Parse(recipient.Value));
        message.Subject = subject;

        var body = new BodyBuilder
        {
            HtmlBody = htmlBody,
            TextBody = textBody,
        };
        message.Body = body.ToMessageBody();
        return message;
    }

    private async Task SendMessageAsync(MimeMessage message, CancellationToken ct)
    {
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
    }
}
