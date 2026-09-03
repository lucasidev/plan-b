namespace Planb.Reviews.Domain.Catalog;

/// <summary>
/// De qué lado cae una opción cuando la ficha la publica (ADR-0083). Es lo único que decide el color:
/// el rojo de alarma marca la opción negativa y nada más. No es un puntaje ni se suma: dos opciones
/// negativas de frases distintas no se promedian, cada frase es su propio dato.
///
/// <para>
/// Las frases de contexto llevan <see cref="None"/>: no se publican dato por dato, así que no tienen
/// lado. Cómo terminó una cursada no es "bueno" ni "malo" en la ficha: alimenta la tasa de
/// finalización agregada, que se lee sola.
/// </para>
/// </summary>
public enum OptionValence
{
    None,
    Positive,
    Neutral,
    Negative,
}
