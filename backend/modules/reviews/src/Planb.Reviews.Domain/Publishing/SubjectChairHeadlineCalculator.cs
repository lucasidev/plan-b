using Planb.Reviews.Domain.Catalog;
using Planb.Reviews.Domain.Reviews;

namespace Planb.Reviews.Domain.Publishing;

/// <summary>
/// Elige, entre las frases de conducta observable que respondió una cátedra, la que tiene la moda
/// más marcada (US-129): es la frase que mejor resume "cómo es esta cátedra" en una sola línea
/// para la ficha de materia, tomando el mismo ítem, opción y porcentaje que la ficha de la propia
/// cátedra ya publica como su moda (ADR-0083). No inventa un cálculo nuevo, elige cuál de los que
/// ya existen mostrar en la lista de cátedras.
/// </summary>
public static class SubjectChairHeadlineCalculator
{
    /// <summary>
    /// Los códigos <c>CHAIR_*</c> en el orden del catálogo (<c>CatalogSeedData.Items</c>, capa
    /// Application, que el dominio no puede referenciar). Espejo literal, usado solo para
    /// desempatar cuando dos frases muestran exactamente el mismo porcentaje.
    /// </summary>
    private static readonly string[] ChairConductCatalogOrder =
    [
        "CHAIR_ANSWERS_IN_CLASS",
        "CHAIR_CLASSES_HELD",
        "CHAIR_PRACTICE_MATCHES_THEORY",
        "CHAIR_ANSWERS_OUTSIDE_CLASS",
        "CHAIR_EXAM_DATE_NOTICE",
        "CHAIR_SYLLABUS_UPFRONT",
        "CHAIR_OFF_SYLLABUS_EXAMS",
    ];

    /// <summary>
    /// Null si ninguna frase de conducta junta el piso de respuestas: una cátedra publica desde 10
    /// reseñas, pero una frase puntual puede tener menos respuestas que eso (saltear siempre vale,
    /// ADR-0082), y publicar la moda de una frase que respondió una sola persona delataría quién
    /// dijo qué. También null si la cátedra no tiene ni una respuesta de conducta, o si el catálogo
    /// cambió y lo único que juntó es un tramo retirado.
    /// </summary>
    public static SubjectChairHeadline? Calculate(IReadOnlyList<ItemTally> tallies)
    {
        ArgumentNullException.ThrowIfNull(tallies);

        var candidates = tallies
            .Where(t =>
                t.Layer == ItemLayer.ChairConduct
                && !t.IsRetired
                && t.Total >= PublishingRules.ChairMinimumReviews
                && t.Mode is not null)
            .ToList();

        if (candidates.Count == 0)
        {
            return null;
        }

        var winner = candidates
            .OrderByDescending(t => Percent(t.Mode!.Count, t.Total))
            .ThenBy(CatalogOrder)
            .First();

        return new SubjectChairHeadline(
            winner.ItemCode,
            winner.Mode!.Value,
            Percent(winner.Mode.Count, winner.Total),
            winner.Total);
    }

    /// <summary>
    /// La posición en <see cref="ChairConductCatalogOrder"/>. Un código que no está en la lista (no
    /// debería pasar con el catálogo vigente) se manda al final en vez de romper el desempate.
    /// </summary>
    private static int CatalogOrder(ItemTally tally)
    {
        var index = Array.IndexOf(ChairConductCatalogOrder, tally.ItemCode);
        return index < 0 ? ChairConductCatalogOrder.Length : index;
    }

    private static int Percent(int count, int total) =>
        total <= 0 ? 0 : (int)Math.Round(100d * count / total, MidpointRounding.AwayFromZero);
}
