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

    /// <summary>
    /// Los conteos de varias cátedras, cada una por separado. Es lo que alimenta la ficha de la
    /// materia, que existe para contestar si algo es de la materia o de la cátedra que te tocó: esa
    /// pregunta necesita ver a cada una aparte, no la suma.
    ///
    /// <para>
    /// Devuelve una entrada por cada cátedra pedida, incluidas las que no tienen una sola reseña:
    /// que una cátedra no junte voces es información que la ficha publica ("junta 3, con 7 más se
    /// publica"), no una fila para omitir.
    /// </para>
    /// </summary>
    Task<SubjectTallies> GetPerChairAsync(
        IReadOnlyList<(Guid ChairId, string ChairName)> chairs,
        CancellationToken ct = default);

    /// <summary>
    /// Una cátedra al azar entre las que ya publican, para la muestra de la entrada (US-221).
    /// Devuelve null cuando ninguna cruzó el piso todavía.
    ///
    /// <para>
    /// El sorteo lo hace la base y no el llamador a propósito: elegir en memoria obligaría a
    /// traerse la lista entera de cátedras que publican para descartarla, y sobre todo dejaría el
    /// criterio del sorteo donde alguien puede ordenarlo "por las mejores" sin que se note. Acá el
    /// único orden posible es el azar.
    /// </para>
    ///
    /// <para>
    /// Al azar y no por cantidad de voces es la decisión de US-221: la de más voces sería un
    /// destacado disfrazado, y cualquiera entre todas podría caer en una que todavía junta las
    /// primeras y no tiene nada que mostrar.
    /// </para>
    /// </summary>
    Task<Guid?> PickPublishingChairAsync(int minimumReviews, CancellationToken ct = default);
}

/// <summary>
/// Lo que la base contó para una materia: sus cátedras por separado, los períodos que cubren esas
/// reseñas y el texto de cada ítem.
///
/// <para>
/// Los períodos viajan sueltos y no por cátedra porque lo que la ficha dice es de la materia
/// entera ("111 voces en 3 cátedras, de 2023 a 2026"): de cuándo son las voces de cada cátedra ya
/// lo cuenta su propia ficha.
/// </para>
/// </summary>
public sealed record SubjectTallies(
    IReadOnlyList<ChairContribution> Chairs,
    IReadOnlyList<Guid> TermIds,
    IReadOnlyDictionary<string, string> ItemTexts);

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
