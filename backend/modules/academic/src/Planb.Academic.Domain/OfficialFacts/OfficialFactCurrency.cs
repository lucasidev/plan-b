namespace Planb.Academic.Domain.OfficialFacts;

/// <summary>
/// Cuál de varias afirmaciones sobre el mismo sujeto y campo es la vigente (ADR-0090): el modelo
/// no tiene ninguna restricción de unicidad que impida que convivan dos fuentes que no cierran o
/// dos períodos, así que el criterio de cuál mostrar en la ficha tiene que ser explícito y vivir acá,
/// no escondido en el <c>ORDER BY</c> de una query.
///
/// <para>
/// El criterio: la afirmación relevada más recientemente gana. Ante empate exacto de
/// <see cref="IRelievedClaim.RelievedAt"/>, gana la que se cargó después
/// (<see cref="IRelievedClaim.CreatedAt"/>). No mira el período ni la fuente: dos afirmaciones del
/// mismo campo pueden describir períodos distintos sin contradecirse, y lo último que releva el
/// equipo es lo que hoy creemos que vale.
/// </para>
/// </summary>
public static class OfficialFactCurrency
{
    /// <summary>
    /// La vigente entre <paramref name="candidates"/>. Los candidatos deben ser todos del mismo
    /// sujeto y campo: mezclar campos distintos no tiene "vigente" en común, y es responsabilidad
    /// del caller agrupar antes de invocar.
    /// </summary>
    public static T SelectCurrent<T>(IReadOnlyCollection<T> candidates)
        where T : IRelievedClaim
    {
        ArgumentNullException.ThrowIfNull(candidates);
        if (candidates.Count == 0)
        {
            throw new ArgumentException("At least one candidate is required.", nameof(candidates));
        }

        return candidates
            .OrderByDescending(c => c.RelievedAt)
            .ThenByDescending(c => c.CreatedAt)
            .First();
    }
}
