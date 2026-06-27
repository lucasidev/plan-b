using System.ComponentModel.DataAnnotations;

namespace Planb.Identity.Infrastructure.Email;

/// <summary>
/// Knobs del link de verificación docente (US-031). Bound desde <c>Identity:TeacherVerification</c>.
/// Default vacío para que un entorno que se olvide de overridear falle fast al startup
/// (<c>ValidateDataAnnotations().ValidateOnStart()</c>). Valor dev en
/// <c>appsettings.Development.json</c>; prod desde env vars. Apunta a <c>/verify-teacher</c>.
/// </summary>
public sealed class TeacherVerificationEmailOptions
{
    public const string SectionName = "Identity:TeacherVerification";

    [Required]
    [Url]
    public string LinkBaseUrl { get; init; } = string.Empty;
}
