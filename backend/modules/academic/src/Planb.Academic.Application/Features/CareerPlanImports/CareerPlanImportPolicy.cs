namespace Planb.Academic.Application.Features.CareerPlanImports;

/// <summary>
/// Autorización compartida por los endpoints de staff sobre career plan imports: aprobar y listar la
/// cola (<c>CareerPlanImportQueue</c>). El catálogo tiene un solo escritor: el alumno propone (crea
/// el import), el staff decide (aprueba o rechaza). El rol se gatea a nivel HTTP con RequireRole: el
/// JwtIssuer del backend emite el claim de rol (ClaimTypes.Role) y ASP.NET lo matchea contra este
/// nombre.
///
/// <para>
/// <see cref="RoleName"/> debe coincidir con <c>Planb.Identity.Domain.Users.UserRole.Admin</c>
/// (.ToString()). Acoplamiento cross-módulo por string, intencional (mismo patrón que
/// AdminCareerPolicy/AdminSubjectPolicy): Academic no referencia el enum de Identity. El integration
/// test de gating verifica que el string siga matcheando el claim real.
/// </para>
/// </summary>
internal static class CareerPlanImportPolicy
{
    public const string RoleName = "Admin";
}
