namespace Planb.Identity.Domain.Users;

/// <summary>
/// Idioma de la UI seleccionado por el user. La app actual solo soporta
/// EsRioplatense; las otras opciones quedan como placeholder para cuando
/// aterrice i18n (deuda explícita en US-072).
/// </summary>
public enum Language
{
    EsRioplatense = 0,
    EsNeutro = 1,
    En = 2,
}
