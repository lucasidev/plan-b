namespace Planb.Academic.Application.Features.AdminAgnAudits;

/// <summary>
/// Autorización de los endpoints de auditorías de la AGN (issue #506). Mismo criterio que
/// <c>AdminUniversityPolicy</c>: el rol se gatea a nivel HTTP con RequireRole, comparado contra el
/// claim de rol que emite el JwtIssuer de Identity. Acoplamiento por string intencional (Academic no
/// referencia el enum de Identity, ADR-0017).
/// </summary>
internal static class AdminAgnAuditPolicy
{
    public const string RoleName = "Admin";
}
