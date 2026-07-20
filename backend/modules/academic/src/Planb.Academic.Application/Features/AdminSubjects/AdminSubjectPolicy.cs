namespace Planb.Academic.Application.Features.AdminSubjects;

/// <summary>
/// Autorización compartida por los endpoints de gestión de materias (admin CRUD, US-062). El rol
/// se gatea a nivel HTTP con RequireRole: el JwtIssuer del backend emite el claim de rol
/// (ClaimTypes.Role) y ASP.NET lo matchea contra este nombre.
///
/// <para>
/// <see cref="RoleName"/> debe coincidir con <c>Planb.Identity.Domain.Users.UserRole.Admin</c>
/// (.ToString()). Es un acoplamiento cross-módulo por string, intencional: Academic no referencia
/// el enum de Identity (persistence ignorance / boundaries). El integration test de gating verifica
/// que el string siga matcheando el claim real. Mismo patrón que AdminCareerPolicy.
/// </para>
/// </summary>
internal static class AdminSubjectPolicy
{
    public const string RoleName = "Admin";
}
