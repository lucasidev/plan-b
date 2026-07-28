namespace Planb.SharedKernel.Primitives;

/// <summary>
/// Parseo de un enum desde un string que viene de afuera (body HTTP, payload de un import, config).
///
/// <para>
/// Existe porque <see cref="Enum.TryParse{TEnum}(string, bool, out TEnum)"/> acepta strings
/// numéricos y eso abre un agujero silencioso: el valor se persiste con <c>ToString()</c>, así que
/// una fila termina con <c>"9"</c> en una columna que el resto del sistema lee como enum. Y no lo
/// ataja ningún CHECK: los constraints de este proyecto están escritos como implicaciones ("si el
/// método es X entonces..."), y un valor que no es ninguno de los conocidos las satisface todas por
/// vacuidad.
/// </para>
/// <para>
/// <c>Enum.IsDefined</c> tampoco alcanza, que es la trampa que hace falta nombrar: frena <c>"9"</c>
/// porque ningún miembro vale 9, pero <c>"0"</c> y <c>"1"</c> parsean a los dos primeros miembros
/// del enum y pasan como si fueran nombres válidos. Exigir que el string coincida con el nombre del
/// miembro cierra la familia entera en vez de los valores que sobran.
/// </para>
/// <para>
/// El contrato de este proyecto lleva siempre el nombre canónico en inglés
/// (<c>"Coursework"</c>, <c>"FourMonth"</c>), nunca el número, así que no se pierde ninguna entrada
/// legítima. Los flags no están contemplados: ningún enum del dominio lo es.
/// </para>
/// </summary>
public static class StrictEnum
{
    /// <summary>
    /// True solo si <paramref name="raw"/> es el nombre de un miembro de <typeparamref name="TEnum"/>,
    /// comparado sin distinguir mayúsculas y sin espacios alrededor.
    /// </summary>
    public static bool TryParse<TEnum>(string? raw, out TEnum value)
        where TEnum : struct, Enum
    {
        value = default;
        if (string.IsNullOrWhiteSpace(raw)
            || !Enum.TryParse(raw, ignoreCase: true, out value)
            || !Enum.IsDefined(value))
        {
            return false;
        }

        return string.Equals(value.ToString(), raw.Trim(), StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>Variante para cuando el caller quiere el valor o null, sin el patrón try.</summary>
    public static TEnum? Parse<TEnum>(string? raw)
        where TEnum : struct, Enum =>
        TryParse<TEnum>(raw, out var value) ? value : null;
}
