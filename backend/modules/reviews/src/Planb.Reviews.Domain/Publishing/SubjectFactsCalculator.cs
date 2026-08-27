using Planb.Reviews.Domain.Catalog;
using Planb.Reviews.Domain.CourseReviews;

namespace Planb.Reviews.Domain.Publishing;

/// <summary>
/// Decide qué publica la ficha de una materia a partir de los conteos de sus cátedras (US-129,
/// ADR-0085). Lógica pura, como <see cref="ChairFactsCalculator"/>: entra lo que la base contó y
/// sale lo que la pantalla dibuja.
///
/// <para>
/// La regla que gobierna todo: **una materia no se reseña, se deriva**. Solo aportan las cátedras
/// que cruzaron el piso; las demás se listan con su cuenta y nada más. Si ninguna lo cruzó, la
/// materia está vacía y lo dice, en vez de mostrar un cero que nadie sostiene.
/// </para>
/// </summary>
public static class SubjectFactsCalculator
{
    /// <summary>
    /// Qué proporción tiene que marcar la opción negativa en TODAS las cátedras para que el ítem
    /// cuente como rasgo de la materia. La mitad: por debajo, el ítem no está diciendo eso de nadie.
    /// </summary>
    public const double SharedTraitThreshold = 0.5d;

    /// <summary>
    /// Arma lo publicable de una materia.
    /// </summary>
    /// <param name="chairs">Todas sus cátedras, con sus conteos crudos y su cuenta de reseñas.</param>
    public static SubjectFacts Calculate(IReadOnlyList<ChairContribution> chairs)
    {
        ArgumentNullException.ThrowIfNull(chairs);

        var listings = chairs
            .Select(c => new ChairListing(
                c.ChairId,
                c.ChairName,
                c.ReviewCount,
                c.ReviewCount >= PublishingRules.ChairMinimumReviews,
                Math.Max(0, PublishingRules.ChairMinimumReviews - c.ReviewCount),
                c.LastReviewedAt))
            // Por cantidad de voces y nunca por sus números: ordenarlas por resultado sería un
            // ranking, y acá no hay ranking. La que más aportó va primero, y nada más.
            .OrderByDescending(c => c.ReviewCount)
            .ThenBy(c => c.ChairName, StringComparer.OrdinalIgnoreCase)
            .ToList();

        var publishing = chairs
            .Where(c => c.ReviewCount >= PublishingRules.ChairMinimumReviews)
            .ToList();

        if (publishing.Count == 0)
        {
            return new SubjectFacts(
                IsPublished: false,
                TotalVoices: 0,
                PublishingChairs: 0,
                ChairsBelowFloor: listings.Count(c => !c.IsPublished),
                Attempts: null,
                Completion: null,
                Spread: [],
                Shared: [],
                Chairs: listings);
        }

        return new SubjectFacts(
            IsPublished: true,
            TotalVoices: publishing.Sum(c => c.ReviewCount),
            PublishingChairs: publishing.Count,
            ChairsBelowFloor: listings.Count(c => !c.IsPublished),
            Attempts: Aggregate(publishing, PublishingRules.AttemptsItemCode),
            Completion: CompletionOf(publishing),
            Spread: BuildSpread(publishing),
            Shared: BuildShared(publishing),
            Chairs: listings);
    }

    /// <summary>
    /// Suma un ítem sobre todas las cátedras que publican y devuelve su distribución. El
    /// denominador son las respuestas a ese ítem, no las reseñas: lo salteado no cuenta.
    /// </summary>
    private static ItemDistribution? Aggregate(
        IReadOnlyList<ChairContribution> chairs, string itemCode)
    {
        var tallies = chairs
            .SelectMany(c => c.Tallies)
            .Where(t => string.Equals(t.ItemCode, itemCode, StringComparison.Ordinal))
            .ToList();

        if (tallies.Count == 0)
        {
            return null;
        }

        // Se suman opción por opción, respetando el orden en que se ofrecieron al responder.
        var options = tallies
            .SelectMany(t => t.Options)
            .GroupBy(o => o.Value)
            .Select(g => new
            {
                Value = g.Key,
                Order = g.Min(o => o.Order),
                g.First().Label,
                g.First().Valence,
                Count = g.Sum(o => o.Count),
            })
            .OrderBy(o => o.Order)
            .ToList();

        var total = options.Sum(o => o.Count);
        if (total == 0)
        {
            return null;
        }

        var mode = options.OrderByDescending(o => o.Count).ThenBy(o => o.Order).First();

        return new ItemDistribution(
            itemCode,
            mode.Label,
            Percent(mode.Count, total),
            total,
            options
                .Select(o => new PublishedOption(o.Label, Percent(o.Count, total), o.Valence))
                .ToList());
    }

    /// <summary>
    /// La tasa de finalización de la materia: las cursadas que llegaron sobre todas las contadas,
    /// sumando las cátedras que publican. Misma definición que en la ficha de cátedra.
    /// </summary>
    private static CompletionRate? CompletionOf(IReadOnlyList<ChairContribution> chairs)
    {
        var reaching = 0;
        var total = 0;

        var outcomes = chairs
            .SelectMany(c => c.Tallies)
            .Where(t => string.Equals(
                t.ItemCode, PublishingRules.OutcomeItemCode, StringComparison.Ordinal));

        foreach (var tally in outcomes)
        {
            total += tally.Total;
            reaching += tally.Options
                .Where(o => PublishingRules.OutcomeValuesReachingTheEnd.Contains(o.Value))
                .Sum(o => o.Count);
        }

        return total == 0
            ? null
            : new CompletionRate(
                reaching,
                total,
                (int)Math.Round(10d * reaching / total, MidpointRounding.AwayFromZero));
    }

    /// <summary>
    /// Los ítems donde las cátedras difieren de verdad. Con una sola cátedra publicando no hay nada
    /// que contrastar y la sección entera desaparece: es el caso honesto, no un hueco.
    /// </summary>
    private static IReadOnlyList<ChairSpread> BuildSpread(IReadOnlyList<ChairContribution> chairs)
    {
        if (chairs.Count < 2)
        {
            return [];
        }

        var spreads = new List<ChairSpread>();

        foreach (var (code, perChair) in ComparableItems(chairs))
        {
            var highest = perChair.MaxBy(Share)!;
            var lowest = perChair.MinBy(Share)!;

            // La misma regla que decide un contraste en la ficha de cátedra: si los intervalos se
            // tocan, la diferencia puede ser del tamaño de la muestra y no se publica.
            if (!WilsonInterval.Separated(
                    highest.Tally.NegativeInterval, lowest.Tally.NegativeInterval))
            {
                continue;
            }

            spreads.Add(new ChairSpread(
                code,
                NegativeLabelOf(highest.Tally),
                perChair
                    .Select(x => new ChairShare(
                        x.Chair.ChairId,
                        x.Chair.ChairName,
                        Percent(x.Tally.NegativeCount, x.Tally.Total),
                        x.Tally.Total))
                    .OrderByDescending(s => s.Percent)
                    .ToList()));
        }

        // El que más separa primero: es el que mejor contesta "¿es la materia o es la cátedra?".
        return spreads
            .OrderByDescending(s => s.ByChair[0].Percent - s.ByChair[^1].Percent)
            .ToList();
    }

    /// <summary>
    /// Los ítems que todas las cátedras marcan parejo y fuerte. Que nadie se salve es lo que los
    /// vuelve un rasgo de la materia: no depende de con quién te toque.
    /// </summary>
    private static IReadOnlyList<SharedTrait> BuildShared(IReadOnlyList<ChairContribution> chairs)
    {
        if (chairs.Count < 2)
        {
            return [];
        }

        var shared = new List<SharedTrait>();

        foreach (var (code, perChair) in ComparableItems(chairs))
        {
            if (perChair.Any(x => Share(x) <= SharedTraitThreshold))
            {
                continue;
            }

            var highest = perChair.MaxBy(Share)!;
            var lowest = perChair.MinBy(Share)!;

            // Si además se separan, el ítem ya está contado como diferencia y no como rasgo común.
            if (WilsonInterval.Separated(
                    highest.Tally.NegativeInterval, lowest.Tally.NegativeInterval))
            {
                continue;
            }

            shared.Add(new SharedTrait(
                code,
                NegativeLabelOf(highest.Tally),
                Percent(lowest.Tally.NegativeCount, lowest.Tally.Total),
                Percent(highest.Tally.NegativeCount, highest.Tally.Total),
                perChair.Count));
        }

        return shared.OrderByDescending(s => s.LowestPercent).ToList();
    }

    /// <summary>
    /// Los ítems que TODAS las cátedras que publican respondieron, con su opción negativa. Solo
    /// esos se pueden comparar: un ítem que una cátedra no tiene no dice nada sobre la diferencia
    /// entre ellas. Los de contexto quedan afuera porque no se publican dato por dato.
    /// </summary>
    private static IEnumerable<(string Code, List<ChairItem> PerChair)> ComparableItems(
        IReadOnlyList<ChairContribution> chairs)
    {
        var codes = chairs[0].Tallies
            .Where(t => t.Layer != ItemLayer.Context && t.Total > 0 && t.NegativeInterval is not null)
            .Select(t => t.ItemCode)
            .ToList();

        foreach (var code in codes)
        {
            var perChair = new List<ChairItem>();
            var missing = false;

            foreach (var chair in chairs)
            {
                var tally = chair.Tallies.FirstOrDefault(t =>
                    string.Equals(t.ItemCode, code, StringComparison.Ordinal) && t.Total > 0);

                if (tally is null || tally.NegativeInterval is null)
                {
                    missing = true;
                    break;
                }

                perChair.Add(new ChairItem(chair, tally));
            }

            if (!missing && perChair.Count >= 2)
            {
                yield return (code, perChair);
            }
        }
    }

    private static double Share(ChairItem item) =>
        item.Tally.Total == 0 ? 0d : (double)item.Tally.NegativeCount / item.Tally.Total;

    private static string NegativeLabelOf(ItemTally tally) =>
        tally.Options.FirstOrDefault(o => o.Valence == OptionValence.Negative)?.Label ?? string.Empty;

    private static int Percent(int count, int total) =>
        total <= 0 ? 0 : (int)Math.Round(100d * count / total, MidpointRounding.AwayFromZero);

    /// <summary>Un ítem de una cátedra puntual, mientras se comparan entre sí.</summary>
    private sealed record ChairItem(ChairContribution Chair, ItemTally Tally);
}

/// <summary>
/// Lo que una cátedra le aporta a la ficha de su materia: quién es, cuántas voces junta y sus
/// conteos crudos.
/// </summary>
public sealed record ChairContribution(
    Guid ChairId,
    string ChairName,
    int ReviewCount,
    IReadOnlyList<ItemTally> Tallies,
    DateTimeOffset? LastReviewedAt);
