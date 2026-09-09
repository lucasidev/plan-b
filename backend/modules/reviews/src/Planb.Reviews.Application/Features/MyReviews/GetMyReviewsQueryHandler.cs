using Planb.Academic.Application.Contracts;
using Planb.Reviews.Application.Abstractions.Persistence;
using Planb.Reviews.Domain.Publishing;

namespace Planb.Reviews.Application.Features.MyReviews;

/// <summary>
/// Arma lo que una cuenta aportó (US-165, US-166): sus reseñas más los nombres del catálogo.
///
/// <para>
/// Las reseñas salen de <see cref="IMyReviewsQueryService"/>, que no sale del schema
/// <c>reviews</c>. Los nombres se le piden a academic por contrato, **en una sola llamada con
/// todos los ids**: ese lote es lo que hace innecesario el JOIN cross-schema que este read tenía,
/// cuyo argumento era que pedirlos de a uno sería un N+1.
/// </para>
///
/// <para>
/// Un id que el catálogo no tiene no rompe la fila. La materia declarada y todavía sin vincular
/// existe como concepto del producto (US-197), y una reseña propia tiene que poder verse y
/// borrarse aunque su materia esté pendiente: por eso el nombre ausente cae a un texto y no a una
/// excepción.
/// </para>
///
/// <para>
/// US-162: por cada respuesta de una reseña con cátedra declarada, se agrega cuántas voces suma
/// ahora la opción elegida y sobre cuántas (SC-018, "ahora 22 de 42 voces"). Los conteos salen del
/// mismo tally que arma la ficha pública de una materia
/// (<see cref="IChairTallyQueryService.GetPerChairAsync"/>, un solo viaje para todas las cátedras
/// distintas de la cuenta), pero sin pasar por el piso de publicación: acá es el registro propio
/// del autor, no lo que se publica, así que el número se ve aunque la cátedra todavía no junte las
/// 10 reseñas del piso.
/// </para>
/// </summary>
public static class GetMyReviewsQueryHandler
{
    /// <summary>Lo que se muestra cuando el catálogo no tiene el id que la reseña guardó.</summary>
    private const string Unknown = "Sin vincular";

    public static async Task<IReadOnlyList<MyReviewView>> Handle(
        Guid accountId,
        IMyReviewsQueryService reviews,
        IAcademicQueryService academic,
        IChairTallyQueryService chairTallies,
        CancellationToken ct)
    {
        var rows = await reviews.ListAsync(accountId, ct);
        if (rows.Count == 0)
        {
            return [];
        }

        var labels = await academic.GetLabelsAsync(
            rows.Select(r => r.SubjectId).Distinct().ToArray(),
            rows.Select(r => r.TermId).Distinct().ToArray(),
            rows.Where(r => r.ChairId is not null).Select(r => r.ChairId!.Value).Distinct().ToArray(),
            ct);

        var talliesByChair = await TalliesByChairAsync(rows, labels, chairTallies, ct);

        return rows
            .Select(r =>
            {
                var subject = labels.Subjects.GetValueOrDefault(r.SubjectId);
                var itemTallies = r.ChairId is { } chairId
                    ? talliesByChair.GetValueOrDefault(chairId)
                    : null;

                return new MyReviewView(
                    r.Id,
                    r.SubjectId,
                    subject?.Name ?? Unknown,
                    subject?.Code ?? string.Empty,
                    r.TermId,
                    labels.Terms.GetValueOrDefault(r.TermId) ?? Unknown,
                    r.ChairId,
                    r.ChairId is null ? null : labels.Chairs.GetValueOrDefault(r.ChairId.Value),
                    r.Answers.Count,
                    WithVoices(r.Answers, itemTallies),
                    r.FreeText,
                    r.CreatedAt,
                    r.UpdatedAt);
            })
            .ToList();
    }

    /// <summary>
    /// Los conteos de cada cátedra distinta entre las reseñas de la cuenta, en un solo viaje
    /// (mismo <see cref="IChairTallyQueryService.GetPerChairAsync"/> que ya usa la ficha de
    /// materia) y no uno por cátedra: varias cursadas de la misma cátedra comparten el mismo tally.
    /// </summary>
    private static async Task<Dictionary<Guid, Dictionary<string, ItemTally>>> TalliesByChairAsync(
        IReadOnlyList<MyReviewRow> rows,
        CatalogLabels labels,
        IChairTallyQueryService chairTallies,
        CancellationToken ct)
    {
        var chairIds = rows
            .Where(r => r.ChairId is not null)
            .Select(r => r.ChairId!.Value)
            .Distinct()
            .ToList();

        if (chairIds.Count == 0)
        {
            return [];
        }

        var counted = await chairTallies.GetPerChairAsync(
            chairIds.Select(id => (id, labels.Chairs.GetValueOrDefault(id) ?? Unknown)).ToList(),
            ct);

        return counted.Chairs.ToDictionary(
            c => c.ChairId,
            c => c.Tallies.ToDictionary(t => t.ItemCode, StringComparer.Ordinal));
    }

    /// <summary>
    /// Cuelga a cada respuesta cuántas voces suma ahora su opción, si hay tally de esa frase. Sin
    /// tally (sin cátedra, o frase retirada que ya no está entre las vigentes) la respuesta viaja
    /// igual, solo que sin esos dos números.
    /// </summary>
    private static IReadOnlyList<MyAnswerView> WithVoices(
        IReadOnlyList<MyAnswerView> answers, Dictionary<string, ItemTally>? itemTallies)
    {
        if (itemTallies is null)
        {
            return answers;
        }

        return answers
            .Select(a => itemTallies.TryGetValue(a.ItemCode, out var tally)
                ? a with
                {
                    OptionVoices = tally.Options.FirstOrDefault(o => o.Value == a.OptionValue)?.Count,
                    ItemTotalVoices = tally.Total,
                }
                : a)
            .ToList();
    }
}
