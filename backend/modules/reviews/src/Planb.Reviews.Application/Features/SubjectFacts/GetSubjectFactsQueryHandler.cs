using Planb.Academic.Application.Contracts;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Domain.Catalog;
using Planb.Reviews.Domain.Publishing;
using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Application.Features.SubjectFacts;

/// <summary>
/// Arma la ficha de una materia (US-129, ADR-0085).
///
/// <para>
/// El handler no decide nada de lo que se publica: pide la materia y sus cátedras a academic, pide
/// los conteos a la base, se los pasa a <see cref="SubjectFactsCalculator"/>, y traduce lo que sale
/// a castellano. La regla de qué se publica y qué se calla vive entera en el dominio.
/// </para>
/// </summary>
public static class GetSubjectFactsQueryHandler
{
    public static async Task<Result<GetSubjectFactsResponse>> Handle(
        GetSubjectFactsQuery query,
        IAcademicQueryService academic,
        IChairTallyQueryService tallies,
        ISubjectPairQueryService pairs,
        CancellationToken ct)
    {
        var subject = await academic.GetSubjectByIdAsync(query.SubjectId, ct);
        if (subject is null)
        {
            return SubjectFactsErrors.SubjectNotFound;
        }

        var chairs = await academic.ListChairsBySubjectAsync(subject.Id, ct);
        var counted = await tallies.GetPerChairAsync(
            chairs.Select(c => (c.Id, c.Name)).ToList(), ct);

        var facts = SubjectFactsCalculator.Calculate(counted.Chairs);

        // Cuántas materias habilita esta al aprobarse: sale del grafo de correlativas del plan, no
        // de las reseñas. Es el dato que dice si una materia trabada traba a nueve más o a ninguna.
        var edges = await academic.ListPrerequisitesByCareerPlanAsync(subject.CareerPlanId, ct);
        var enables = edges.Count(e => e.RequiredSubjectId == subject.Id);

        // La ventana temporal solo se resuelve si la ficha publica: bajo el piso no viaja nada de
        // los datos, y de cuándo son las pocas reseñas que junta es un dato de ellas.
        var years = facts.IsPublished
            ? await academic.ListTermYearsAsync(counted.TermIds, ct)
            : [];

        // Con qué otras materias se llevó esta (US-143). Sale solo de las reseñas, con su propio
        // piso por par y período: no depende de que la materia publique, porque es un dato de la
        // combinación y no de la materia.
        var counts = await pairs.ListForSubjectAsync(subject.Id, ct);
        var takenWith = SubjectPairCalculator.Calculate(
            counts
                .Select(t => new SubjectPairCalculator.Tally(
                    t.OtherSubjectId, t.TermId, t.TogetherCount, t.DroppedCount))
                .ToList());

        // Los nombres de las otras materias se le piden al contrato de academic en lote, no con un
        // JOIN cross-schema (ADR-0087).
        var labels = await academic.GetLabelsAsync(
            takenWith.Select(p => p.OtherSubjectId).Distinct().ToArray(),
            [],
            [],
            ct);

        return Present(subject, facts, counted, enables, years, takenWith, labels);
    }

    private static GetSubjectFactsResponse Present(
        SubjectDetailItem subject,
        Domain.Publishing.SubjectFacts facts,
        SubjectTallies counted,
        int enables,
        IReadOnlyList<int> years,
        IReadOnlyList<SubjectPairCalculator.PairFacts> takenWith,
        CatalogLabels labels)
    {
        var text = (string code) => counted.ItemTexts.TryGetValue(code, out var t) ? t : code;

        return new GetSubjectFactsResponse(
            SubjectId: subject.Id,
            SubjectCode: subject.Code,
            SubjectName: subject.Name,
            YearInPlan: subject.YearInPlan,
            IsPublished: facts.IsPublished,
            TotalVoices: facts.TotalVoices,
            PublishingChairs: facts.PublishingChairs,
            ChairsBelowFloor: facts.ChairsBelowFloor,
            Span: years.Count == 0 ? null : new SubjectSpanView(years[0], years[^1]),
            Attempts: facts.Attempts is { } a
                ? new DistributionView(
                    a.ItemCode,
                    text(a.ItemCode),
                    a.ModeLabel,
                    a.ModePercent,
                    a.Total,
                    a.Options
                        .Select(o => new SliceView(
                            o.Label, o.Percent, o.Valence == OptionValence.Negative))
                        .ToList(),
                    a.OpenEnded is { } tail
                        ? new SliceView(
                            tail.Label, tail.Percent, tail.Valence == OptionValence.Negative)
                        : null)
                : null,
            Completion: facts.Completion is { } c
                ? new SubjectCompletionView(c.OutOfTen, c.Reaching, c.Total)
                : null,
            EnablesCount: enables,
            TakenWith: takenWith
                .Select(p => new TakenWithView(
                    p.OtherSubjectId,
                    labels.Subjects.TryGetValue(p.OtherSubjectId, out var l) ? l.Name : "Sin vincular",
                    labels.Subjects.TryGetValue(p.OtherSubjectId, out var c) ? c.Code : string.Empty,
                    p.TogetherCount,
                    p.DroppedCount,
                    p.IsPublished,
                    p.MissingToPublish))
                .ToList(),
            Spread: facts.Spread
                .Select(s => new SpreadView(
                    s.ItemCode,
                    text(s.ItemCode),
                    s.NegativeLabel,
                    s.ByChair
                        .Select(b => new ChairShareView(b.ChairId, b.ChairName, b.Percent, b.Total))
                        .ToList()))
                .ToList(),
            Shared: facts.Shared
                .Select(s => new SharedView(
                    s.ItemCode,
                    text(s.ItemCode),
                    s.NegativeLabel,
                    s.LowestPercent,
                    s.HighestPercent,
                    s.ChairCount))
                .ToList(),
            Chairs: facts.Chairs
                .Select(c => new SubjectChairView(
                    c.ChairId,
                    c.ChairName,
                    c.ReviewCount,
                    c.IsPublished,
                    c.ReviewsMissingToPublish,
                    c.LastReviewedAt))
                .ToList());
    }
}

/// <summary>Los errores de leer una ficha de materia. Es lectura pública: el único caso es que no exista.</summary>
public static class SubjectFactsErrors
{
    public static readonly Error SubjectNotFound =
        Error.NotFound(
            "reviews.subject_facts.subject_not_found",
            "That subject does not exist.");
}
