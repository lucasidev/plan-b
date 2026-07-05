namespace Planb.Moderation.Application.Features.ReportQueue;

/// <summary>
/// Autorización compartida por los endpoints del backoffice de moderación (US-050/051). Se gatea a
/// nivel HTTP con RequireRole contra el claim de rol del JWT (ClaimTypes.Role que emite el JwtIssuer).
///
/// <para>
/// Los nombres deben coincidir con <c>Planb.Identity.Domain.Users.UserRole.{Moderator,Admin}</c>
/// (.ToString()). Acoplamiento cross-módulo por string, intencional (Moderation no referencia el enum
/// de Identity). Admin también entra: tiene permisos totales (ADR-0008). El integration test de
/// gating verifica que los strings sigan matcheando el claim real.
/// </para>
/// </summary>
internal static class ModerationPolicy
{
    public const string Moderator = "Moderator";
    public const string Admin = "Admin";

    /// <summary>Roles que pueden operar la moderación: moderador o admin.</summary>
    public static readonly string[] StaffRoles = [Moderator, Admin];
}
