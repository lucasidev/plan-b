using Planb.Reviews.Domain.Catalog;
using Planb.Reviews.Domain.Reviews;

namespace Planb.Reviews.Domain.Publishing;

/// <summary>
/// Decide qué publica la ficha de una cátedra a partir de conteos crudos (ADR-0083). Es lógica pura:
/// entra lo que la base contó, sale lo que la pantalla dibuja, sin I/O en el medio. Vive en el
/// dominio y no en el query service justamente por eso: **las reglas de publicación son el producto**
/// y tienen que poder probarse con casos borde sin levantar una base.
///
/// <para>
/// Lo que decide, en orden: si el sujeto publica (piso de 10 reseñas, por privacidad de quien
/// reseña); qué ítems convergen y forman la fama; la moda y la distribución de cada bloque; la tasa
/// de finalización agregada; y qué contrastes contra las cátedras hermanas sobreviven la regla de
/// los intervalos separados. Lo que no sobrevive no se muestra: el silencio es la regla funcionando,
/// no un hueco.
/// </para>
/// </summary>
public static class ChairFactsCalculator
{
    /// <summary>
    /// Cuántos ítems tienen que apuntar al mismo lado para que la ficha lo cuente como fama. Dos es
    /// coincidencia y tres es un patrón; se eligió tres porque es lo que hace que la afirmación de
    /// arriba no dependa de un solo ítem mal redactado.
    /// </summary>
    public const int ConvergenceMinimumItems = 3;

    /// <summary>
    /// Qué proporción de una opción negativa cuenta como "este ítem apunta para el lado malo".
    /// La mitad de quienes respondieron: por debajo de eso, el ítem no está diciendo eso.
    /// </summary>
    public const double ConvergenceThreshold = 0.5d;

    /// <summary>
    /// Arma lo publicable de una cátedra.
    /// </summary>
    /// <param name="reviewCount">Reseñas de la cátedra. Decide el piso.</param>
    /// <param name="tallies">Conteos por ítem del sujeto.</param>
    /// <param name="siblingTallies">Los mismos ítems, sumados sobre las otras cátedras de la materia.</param>
    /// <param name="completion">Cuántas cursadas llegaron (aprobada o regular) sobre el total.</param>
    public static ChairFacts Calculate(
        int reviewCount,
        IReadOnlyList<ItemTally> tallies,
        IReadOnlyList<ItemTally> siblingTallies,
        (int Reaching, int Total)? completion)
    {
        ArgumentNullException.ThrowIfNull(tallies);
        ArgumentNullException.ThrowIfNull(siblingTallies);

        // El piso protege a quien reseña, no a la institución: con menos de 10, el titular deduce
        // quién dijo qué. La ficha existe igual y dice cuántas le faltan.
        if (reviewCount < PublishingRules.ChairMinimumReviews)
        {
            return new ChairFacts(
                IsPublished: false,
                ReviewCount: reviewCount,
                ReviewsMissingToPublish: PublishingRules.ChairMinimumReviews - reviewCount,
                Fame: [],
                ChairConduct: [],
                StudentExperience: [],
                Completion: null,
                Contrasts: []);
        }

        var published = tallies.Where(t => t.Total > 0).ToList();

        return new ChairFacts(
            IsPublished: true,
            ReviewCount: reviewCount,
            ReviewsMissingToPublish: 0,
            Fame: BuildFame(published),
            ChairConduct: BuildBlock(published, ItemLayer.ChairConduct),
            StudentExperience: BuildBlock(published, ItemLayer.StudentExperience),
            Completion: BuildCompletion(completion),
            Contrasts: BuildContrasts(published, siblingTallies));
    }

    /// <summary>
    /// La fama: los ítems cuya opción negativa la sostiene más de la mitad de quienes respondieron.
    /// Si son al menos tres, convergen y la ficha lo dice arriba. Se devuelve como un solo hecho
    /// con sus ítems: la frase que lo enuncia es de la capa de presentación, que sabe el idioma;
    /// el dominio dice cuáles concuerdan y cuántos son.
    /// </summary>
    private static IReadOnlyList<ConvergingFact> BuildFame(IReadOnlyList<ItemTally> tallies)
    {
        var agreeing = tallies
            .Where(t => t.Layer != ItemLayer.Context)
            .Where(t => t.Total > 0 && (double)t.NegativeCount / t.Total > ConvergenceThreshold)
            .OrderByDescending(t => (double)t.NegativeCount / t.Total)
            .Select(t => t.ItemCode)
            .ToList();

        return agreeing.Count >= ConvergenceMinimumItems
            ? [new ConvergingFact(agreeing, agreeing.Count)]
            : [];
    }

    /// <summary>Un bloque de la ficha: sus ítems con moda y distribución. Los bloques no se suman.</summary>
    private static IReadOnlyList<PublishedItem> BuildBlock(
        IReadOnlyList<ItemTally> tallies,
        ItemLayer layer) =>
        tallies
            .Where(t => t.Layer == layer)
            .Select(ToPublishedItem)
            .Where(item => item is not null)
            .Select(item => item!)
            .ToList();

    private static PublishedItem? ToPublishedItem(ItemTally tally)
    {
        var mode = tally.Mode;
        if (mode is null || tally.Total == 0)
        {
            return null;
        }

        return new PublishedItem(
            tally.ItemCode,
            mode.Label,
            Percent(mode.Count, tally.Total),
            mode.Valence == OptionValence.Negative,
            tally.Total,
            tally.Options
                .OrderBy(o => o.Order)
                .Select(o => new PublishedOption(o.Label, Percent(o.Count, tally.Total), o.Valence))
                .ToList());
    }

    private static CompletionRate? BuildCompletion((int Reaching, int Total)? completion)
    {
        if (completion is not { } c || c.Total <= 0)
        {
            return null;
        }

        return new CompletionRate(
            c.Reaching,
            c.Total,
            (int)Math.Round(10d * c.Reaching / c.Total, MidpointRounding.AwayFromZero));
    }

    /// <summary>
    /// Los contrastes contra las hermanas, uno por ítem, y solo los que la regla deja pasar: los
    /// intervalos de las dos proporciones negativas no se tocan. Sin hermanas con datos no hay
    /// contraste que hacer, y la sección entera no aparece: es el caso de la cátedra única, donde
    /// no hay base justa contra la cual comparar.
    /// </summary>
    private static IReadOnlyList<SiblingContrast> BuildContrasts(
        IReadOnlyList<ItemTally> tallies,
        IReadOnlyList<ItemTally> siblingTallies)
    {
        var siblingsByCode = siblingTallies
            .Where(t => t.Total > 0)
            .ToDictionary(t => t.ItemCode, StringComparer.Ordinal);

        var contrasts = new List<SiblingContrast>();
        foreach (var here in tallies.Where(t => t.Layer != ItemLayer.Context))
        {
            if (!siblingsByCode.TryGetValue(here.ItemCode, out var siblings))
            {
                continue;
            }

            if (!WilsonInterval.Separated(here.NegativeInterval, siblings.NegativeInterval))
            {
                continue;
            }

            contrasts.Add(new SiblingContrast(
                here.ItemCode,
                Percent(here.NegativeCount, here.Total),
                here.NegativeCount,
                here.Total,
                Percent(siblings.NegativeCount, siblings.Total),
                siblings.NegativeCount,
                siblings.Total));
        }

        // El más separado primero: es el que más distingue a esta cátedra de sus hermanas.
        return contrasts
            .OrderByDescending(c => Math.Abs(c.HerePercent - c.SiblingsPercent))
            .ToList();
    }

    private static int Percent(int count, int total) =>
        total <= 0 ? 0 : (int)Math.Round(100d * count / total, MidpointRounding.AwayFromZero);
}
