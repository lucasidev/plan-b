namespace Planb.Reviews.Application.Features.Curation;

/// <summary>
/// Autorización de la curaduría (ADR-0084). Mismo criterio que las policies de academic: el rol se
/// gatea a nivel HTTP con RequireRole contra el claim que emite el JwtIssuer, y el string se repite
/// en vez de referenciar el enum de Identity, que vive en otro módulo. El integration test de
/// gating verifica que siga matcheando el claim real.
///
/// <para>
/// Acá el gate importa más que en el resto del backoffice: lo que hay del otro lado es texto que
/// alguien escribió con sus palabras, y el producto le prometió que no se publica.
/// </para>
/// </summary>
internal static class CurationPolicy
{
    public const string RoleName = "Admin";
}
