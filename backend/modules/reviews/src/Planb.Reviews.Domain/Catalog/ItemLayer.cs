namespace Planb.Reviews.Domain.Catalog;

/// <summary>
/// Las tres capas de la reseña (ADR-0082). No es una agrupación visual: define qué se publica y qué
/// no, y la publicación las lee distinto.
/// </summary>
public enum ItemLayer
{
    /// <summary>
    /// El contexto: período, cátedra, modalidad, cómo terminó, veces cursada. **No se publica
    /// nunca** dato por dato. Controla el sesgo de lectura y alimenta agregados propios (la tasa de
    /// finalización, los intentos), jamás una respuesta individual.
    /// </summary>
    Context,

    /// <summary>
    /// Qué hizo la cátedra: conducta que cualquiera en el aula vio, en frecuencias gruesas. Se
    /// publica como conteo (moda y distribución) en su propio bloque.
    /// </summary>
    ChairConduct,

    /// <summary>
    /// Qué te pasó a vos: la vivencia en primera persona. Se publica en su bloque, y jamás se suma
    /// con el de conducta: sumarlos sería el puntaje único que ADR-0083 descarta.
    /// </summary>
    StudentExperience,
}
