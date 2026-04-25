namespace Planb.Identity.Infrastructure.Email;

/// <summary>
/// Bound from configuration section <c>Smtp</c>. See <c>appsettings.json</c>.
/// </summary>
public sealed class SmtpOptions
{
    public const string SectionName = "Smtp";

    public string Host { get; init; } = "localhost";
    public int Port { get; init; } = 1025;
    public bool UseSsl { get; init; }
    public string? Username { get; init; }
    public string? Password { get; init; }
    public string FromEmail { get; init; } = "noreply@planb.local";
    public string FromName { get; init; } = "planb";
}
