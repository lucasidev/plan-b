namespace Planb.Academic.Application.Features.OfficialFacts;

/// <summary>
/// Autorización del endpoint de carga de afirmaciones (ADR-0090, US-194, US-202). Mismo criterio
/// que <c>AdminCareerPolicy</c>: el rol se gatea a nivel HTTP con RequireRole, comparado contra el
/// claim de rol que emite el JwtIssuer de Identity. Acoplamiento por string intencional (Academic no
/// referencia el enum de Identity, ADR-0017); el integration test de gating verifica que matchee.
/// </summary>
internal static class OfficialFactPolicy
{
    public const string RoleName = "Admin";
}
