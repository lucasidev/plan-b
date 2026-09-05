using Planb.Academic.Application.Contracts;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Domain.Catalog;
using Planb.Reviews.Domain.Reviews;
using Planb.Reviews.Domain.Publishing;
using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Application.Features.ChairFacts;

/// <summary>
/// Arma la ficha de una cátedra (US-147, ADR-0083).
///
/// <para>
/// El handler no decide nada de lo que se publica: pide quién es la cátedra a academic, pide los
/// conteos a la base, se los pasa al calculador del dominio, y traduce lo que sale a castellano. El
/// juicio editorial (el piso, la convergencia, los intervalos que no se tocan) vive entero en
/// <see cref="ChairFactsCalculator"/>, y por eso se puede probar sin base.
/// </para>
/// </summary>
public static class GetChairFactsQueryHandler
{
    public static async Task<Result<GetChairFactsResponse>> Handle(
        GetChairFactsQuery query,
        IAcademicQueryService academic,
        IChairTallyQueryService tallies,
        CancellationToken ct)
    {
        var chair = await academic.GetChairByIdAsync(query.ChairId, ct);
        if (chair is null)
        {
            return ChairFactsErrors.ChairNotFound;
        }

        // Las hermanas son las otras cátedras de la misma materia, y la comparación se hace solo
        // contra ellas (ADR-0083): comparar a Pérez contra el promedio de la facultad diría más de
        // la mezcla de materias que de Pérez.
        var siblings = (await academic.ListChairsBySubjectAsync(chair.SubjectId, ct))
            .Where(c => c.Id != chair.Id)
            .Select(c => c.Id)
            .ToList();

        var counted = await tallies.GetTalliesAsync(chair.Id, siblings, ct);

        var facts = ChairFactsCalculator.Calculate(
            counted.ReviewCount,
            counted.Tallies,
            counted.SiblingTallies,
            counted.Completion);

        // La ventana temporal solo se resuelve si la ficha publica: bajo el piso no viaja nada de
        // los datos, y de cuándo son las tres reseñas que junta es un dato de ellas.
        var years = facts.IsPublished
            ? await academic.ListTermYearsAsync(counted.TermIds, ct)
            : [];

        return Present(chair, facts, counted, years);
    }

    private static GetChairFactsResponse Present(
        ChairDetailItem chair,
        Domain.Publishing.ChairFacts facts,
        ChairTallies counted,
        IReadOnlyList<int> years)
    {
        var text = (string code) =>
            counted.ItemTexts.TryGetValue(code, out var t) ? t : code;

        // La etiqueta negativa sale de los conteos, que ya la traen: es la opción de la frase marcada
        // como negativa en el catálogo. Una frase sin negativa (las de contexto) devuelve null y no
        // llega a un contraste, porque el calculador ya los excluyó.
        var negativeLabel = (string code) => counted.Tallies
            .FirstOrDefault(t => string.Equals(t.ItemCode, code, StringComparison.Ordinal))?
            .Options.FirstOrDefault(o => o.Valence == OptionValence.Negative)?.Label ?? string.Empty;

        return new GetChairFactsResponse(
            ChairId: chair.Id,
            ChairName: chair.Name,
            SubjectId: chair.SubjectId,
            SubjectName: chair.SubjectName,
            SubjectCode: chair.SubjectCode,
            LeadTeacherName: FullName(chair),
            IsPublished: facts.IsPublished,
            ReviewCount: facts.ReviewCount,
            ReviewsMissingToPublish: facts.ReviewsMissingToPublish,
            Span: years.Count == 0
                ? null
                : new SpanView(years[0], years[^1], counted.LastReviewedAt),
            Fame: facts.Fame.Count == 0
                ? null
                : new FameView(
                    facts.Fame[0].ItemsAgreeing,
                    facts.Fame[0].ItemCodes
                        .Select(code => new FameItemView(
                            code,
                            text(code),
                            negativeLabel(code),
                            NegativePercent(counted.Tallies, code),
                            TallyTotal(counted.Tallies, code)))
                        .ToList()),
            ChairConduct: facts.ChairConduct.Select(i => ToView(i, text)).ToList(),
            StudentExperience: facts.StudentExperience.Select(i => ToView(i, text)).ToList(),
            Completion: facts.Completion is { } c
                ? new CompletionView(c.OutOfTen, c.Reaching, c.Total)
                : null,
            Contrasts: facts.Contrasts
                .Select(c => new ContrastView(
                    c.ItemCode,
                    text(c.ItemCode),
                    negativeLabel(c.ItemCode),
                    c.HerePercent,
                    c.HereTotal,
                    c.SiblingsPercent,
                    c.SiblingsTotal))
                .ToList());
    }

    /// <summary>
    /// Una frase publicada, con su tramo anterior si lo tiene. El texto del tramo viejo sale del
    /// mismo diccionario que el resto: los conteos traen el texto de TODAS las frases, retiradas
    /// incluidas, justamente para poder enunciar la pregunta que ya no se hace.
    /// </summary>
    private static PublishedItemView ToView(PublishedItem item, Func<string, string> text) =>
        new(
            item.ItemCode,
            text(item.ItemCode),
            item.ModeLabel,
            item.ModePercent,
            item.ModeIsNegative,
            item.Total,
            item.Distribution
                .Select(d => new DistributionSliceView(
                    d.Label, d.Percent, d.Valence == OptionValence.Negative))
                .ToList(),
            item.PreviousSeries is { } previous ? ToView(previous, text) : null,
            item.RetiredAt);

    /// <summary>
    /// Qué proporción eligió la opción negativa de esa frase. Es el mismo cálculo que hizo el
    /// calculador para decidir la convergencia; acá se repite para poder mostrarlo, porque el
    /// dominio devuelve qué frases concuerdan y no con cuánto (esa es la pregunta de la pantalla).
    /// </summary>
    private static int NegativePercent(IReadOnlyList<ItemTally> tallies, string code)
    {
        var tally = tallies.FirstOrDefault(t =>
            string.Equals(t.ItemCode, code, StringComparison.Ordinal));

        return tally is null || tally.Total == 0
            ? 0
            : (int)Math.Round(100d * tally.NegativeCount / tally.Total, MidpointRounding.AwayFromZero);
    }

    /// <summary>
    /// Sobre cuántas voces se calcula esa frase de la fama: el mismo total que ya usa
    /// <see cref="NegativePercent"/> para sacar el porcentaje, expuesto aparte porque la fama
    /// tiene que publicarlo al lado (US-131 N2): un porcentaje sin su "de N" se lee como puntaje.
    /// </summary>
    private static int TallyTotal(IReadOnlyList<ItemTally> tallies, string code)
    {
        var tally = tallies.FirstOrDefault(t =>
            string.Equals(t.ItemCode, code, StringComparison.Ordinal));

        return tally?.Total ?? 0;
    }

    private static string? FullName(ChairDetailItem chair) =>
        chair.LeadFirstName is null && chair.LeadLastName is null
            ? null
            : $"{chair.LeadFirstName} {chair.LeadLastName}".Trim();
}

/// <summary>Los errores de leer una ficha. Es lectura pública: el único caso es que no exista.</summary>
public static class ChairFactsErrors
{
    public static readonly Error ChairNotFound =
        Error.NotFound(
            "reviews.chair_facts.chair_not_found",
            "That chair does not exist or is no longer active.");
}
