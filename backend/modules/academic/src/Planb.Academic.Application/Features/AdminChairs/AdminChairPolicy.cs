namespace Planb.Academic.Application.Features.AdminChairs;

/// <summary>
/// Autorización de los endpoints de gestión de cátedras (US-196, admin). Mismo criterio que
/// <c>AdminTeacherPolicy</c>: el rol se gatea a nivel HTTP con RequireRole contra el claim que emite
/// el JwtIssuer, y el string se repite en vez de referenciar el enum de Identity, que vive en otro
/// módulo. El integration test de gating verifica que siga matcheando el claim real.
/// </summary>
internal static class AdminChairPolicy
{
    public const string RoleName = "Admin";
}
