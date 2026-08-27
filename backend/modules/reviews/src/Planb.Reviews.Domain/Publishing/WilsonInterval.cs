namespace Planb.Reviews.Domain.Publishing;

/// <summary>
/// El intervalo de confianza de Wilson para una proporción, al 95 % (z = 1,96).
///
/// <para>
/// <b>No es un número que se publique.</b> La ficha muestra conteos crudos (ADR-0083); el intervalo
/// es maquinaria interna, y su único trabajo es decidir si una comparación entre dos grupos se
/// publica o se calla: se publica cuando los dos intervalos no se tocan. Se eligió Wilson y no la
/// aproximación normal porque con pocas voces, que es el caso normal de una cátedra, la normal da
/// intervalos que se salen de [0, 1] y afirma diferencias que no están.
/// </para>
/// </summary>
public readonly record struct WilsonInterval
{
    /// <summary>z al 95 %. Es el mismo valor para todo el producto y se publica en el Método.</summary>
    public const double Z = 1.96d;

    public double Proportion { get; }
    public double Lower { get; }
    public double Upper { get; }

    private WilsonInterval(double proportion, double lower, double upper)
    {
        Proportion = proportion;
        Lower = lower;
        Upper = upper;
    }

    /// <summary>
    /// Calcula el intervalo de <paramref name="successes"/> sobre <paramref name="total"/>. Con
    /// total 0 devuelve null: no hay proporción que estimar, y devolver 0 sería afirmar que nadie
    /// lo dijo cuando en realidad nadie contestó.
    /// </summary>
    public static WilsonInterval? For(int successes, int total)
    {
        if (total <= 0 || successes < 0 || successes > total)
        {
            return null;
        }

        var n = (double)total;
        var p = successes / n;
        var z2 = Z * Z;
        var denominator = 1d + z2 / n;
        var center = (p + z2 / (2d * n)) / denominator;
        var margin = Z * Math.Sqrt(p * (1d - p) / n + z2 / (4d * n * n)) / denominator;

        return new WilsonInterval(
            p,
            Math.Max(0d, center - margin),
            Math.Min(1d, center + margin));
    }

    /// <summary>
    /// True si los dos intervalos no se tocan. Es la regla de publicación de toda comparación
    /// (ADR-0083): con pocas voces los intervalos son anchos, se solapan y la comparación se calla
    /// sola, sin necesidad de un piso inventado.
    /// </summary>
    public static bool Separated(WilsonInterval? a, WilsonInterval? b) =>
        a is { } x && b is { } y && (x.Upper < y.Lower || y.Upper < x.Lower);
}
