using Planb.Reviews.Domain.Publishing;

namespace Planb.Reviews.Application.Abstractions.Persistence;

/// <summary>
/// Los conteos crudos que alimentan la ficha de una cátedra (ADR-0083). Cuenta y nada más: qué de
/// esto se publica lo decide <see cref="ChairFactsCalculator"/>, que es dominio puro.
///
/// <para>
/// Esa separación no es ceremonia. Si el SQL decidiera también qué mostrar, las reglas de
/// publicación (el piso, la convergencia, los intervalos que no se tocan) vivirían dentro de una
/// query y solo se podrían probar levantando una base. Acá el SQL cuenta, el dominio decide, y los
/// casos borde de la decisión se prueban con un unit test.
/// </para>
/// </summary>
public interface IChairTallyQueryService
{
    /// <summary>
    /// Los conteos de una cátedra y los de sus hermanas, en un solo viaje.
    ///
    /// <para>
    /// Las hermanas llegan como lista de ids porque quién es hermana lo sabe academic (las otras
    /// cátedras de la misma materia), y reviews no mira su schema (ADR-0017). Lista vacía significa
    /// cátedra única: no hay contraste posible y la sección no aparece.
    /// </para>
    /// </summary>
    Task<ChairTallies> GetTalliesAsync(
        Guid chairId,
        IReadOnlyList<Guid> siblingChairIds,
        CancellationToken ct = default);
}

/// <summary>
/// Lo que la base contó para una cátedra: cuántas reseñas junta, cómo se repartieron las respuestas
/// de cada ítem, lo mismo sumado sobre sus hermanas, y cuántas cursadas llegaron a destino.
///
/// <para>
/// <see cref="ItemTexts"/> viaja al lado y no adentro de <see cref="ItemTally"/> porque el dominio
/// razona en códigos, que son identidad estable, y el texto se afina sin cortar la serie
/// (ADR-0082). Quien arma la respuesta HTTP necesita el castellano; el calculador, no.
/// </para>
/// </summary>
public sealed record ChairTallies(
    int ReviewCount,
    IReadOnlyList<ItemTally> Tallies,
    IReadOnlyList<ItemTally> SiblingTallies,
    (int Reaching, int Total)? Completion,
    IReadOnlyDictionary<string, string> ItemTexts,
    IReadOnlyList<Guid> TermIds,
    DateTimeOffset? LastReviewedAt);
