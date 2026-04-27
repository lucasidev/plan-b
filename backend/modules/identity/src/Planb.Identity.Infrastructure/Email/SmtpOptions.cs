using System.ComponentModel.DataAnnotations;

namespace Planb.Identity.Infrastructure.Email;

/// <summary>
/// Bound from configuration section <c>Smtp</c>. Defaults are intentionally empty
/// so any environment that forgets to override the section fails fast at startup
/// (validated via <c>ValidateDataAnnotations().ValidateOnStart()</c> in
/// <see cref="DependencyInjection.AddIdentityInfrastructure"/>). Dev values live
/// in <c>appsettings.Development.json</c>; prod values come from env vars.
/// </summary>
public sealed class SmtpOptions
{
    public const string SectionName = "Smtp";

    [Required]
    public string Host { get; init; } = string.Empty;

    [Range(1, 65535)]
    public int Port { get; init; }

    public bool UseSsl { get; init; }

    public string? Username { get; init; }
    public string? Password { get; init; }

    [Required]
    [EmailAddress]
    public string FromEmail { get; init; } = string.Empty;

    [Required]
    public string FromName { get; init; } = string.Empty;
}
