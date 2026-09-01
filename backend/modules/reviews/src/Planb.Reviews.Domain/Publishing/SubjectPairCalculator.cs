using Planb.Reviews.Domain.Reviews;

namespace Planb.Reviews.Domain.Publishing;

/// <summary>
/// Decide qué se publica de con qué otras materias se llevó una (US-143). Lógica pura, como
/// <see cref="ChairFactsCalculator"/> y <see cref="SubjectFactsCalculator"/>: entra lo que la base
/// contó, sale lo que la pantalla dibuja, sin I/O en el medio.
///
/// <para>
/// El piso es <b>por par y período</b> y no por materia: que una materia junte cuarenta reseñas no
/// dice nada de una combinación puntual, y publicar el par igual sería usar un denominador que no
/// es el del dato.
/// </para>
/// </summary>
public static class SubjectPairCalculator
{
    /// <summary>
    /// Lo que la base contó de un par en un período.
    /// </summary>
    public sealed record Tally(Guid OtherSubjectId, Guid TermId, int TogetherCount, int DroppedCount);

    /// <summary>
    /// Un par publicado: cuántas cuentas lo llevaron junto y a cuántas se les cayó alguna de las
    /// dos. <paramref name="MissingToPublish"/> es 0 cuando ya publica.
    /// </summary>
    public sealed record PairFacts(
        Guid OtherSubjectId,
        Guid TermId,
        int TogetherCount,
        int DroppedCount,
        bool IsPublished,
        int MissingToPublish);

    /// <summary>
    /// Ordena y clasifica los pares. <b>No esconde los que no llegan</b>: un par bajo el piso se
    /// dice con cuánto le falta, igual que una cátedra, porque esconderlo mentiría sobre lo que hay.
    ///
    /// <para>
    /// El orden es por cuántas cuentas lo llevaron junto, de mayor a menor, y desempata por período
    /// más reciente. No es orden por conveniencia: la combinación que más gente hizo es la que más
    /// probablemente le toque a quien lee.
    /// </para>
    /// </summary>
    public static IReadOnlyList<PairFacts> Calculate(IReadOnlyList<Tally> tallies)
    {
        ArgumentNullException.ThrowIfNull(tallies);

        return tallies
            .Select(t =>
            {
                var published = t.TogetherCount >= PublishingRules.SubjectPairMinimumReviews;
                return new PairFacts(
                    t.OtherSubjectId,
                    t.TermId,
                    t.TogetherCount,
                    // El conteo de los que dejaron alguna solo viaja si el par publica: por debajo
                    // del piso es el mismo problema de denominador que el piso existe para evitar.
                    published ? t.DroppedCount : 0,
                    published,
                    published
                        ? 0
                        : PublishingRules.SubjectPairMinimumReviews - t.TogetherCount);
            })
            .OrderByDescending(p => p.TogetherCount)
            .ToList();
    }
}
