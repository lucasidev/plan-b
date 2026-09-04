namespace Planb.Identity.Application.Seeding;

/// <summary>
/// Resuelve, desde la variable de entorno <c>PLANB_SEED_PASSWORD</c>, si las personas sembradas
/// usan la password propia de <c>personas.json</c> o una común para todas. El repo es público y
/// ese archivo trae la password del admin en texto: en un ambiente con dominio real, definir esta
/// variable es lo que evita sembrar el backoffice con una password conocida.
/// </summary>
public sealed record SeedPasswordOverride(string? Value)
{
    public const string EnvironmentVariableName = "PLANB_SEED_PASSWORD";
    private const int MinLength = 12;

    /// <summary>
    /// Vacía o ausente: sin override (<c>Value</c> null, cada persona sigue con la suya).
    /// Definida con menos de <see cref="MinLength"/> caracteres: falla fuerte y temprano, el
    /// mismo criterio que las otras opciones obligatorias del host (ver <c>JWT__Secret</c> en
    /// <c>JwtAuthenticationExtensions</c>).
    /// </summary>
    public static SeedPasswordOverride Resolve(string? environmentValue)
    {
        if (string.IsNullOrEmpty(environmentValue))
        {
            return new SeedPasswordOverride(Value: null);
        }

        if (environmentValue.Length < MinLength)
        {
            throw new InvalidOperationException(
                $"{EnvironmentVariableName} must be at least {MinLength} characters when set.");
        }

        return new SeedPasswordOverride(environmentValue);
    }
}
