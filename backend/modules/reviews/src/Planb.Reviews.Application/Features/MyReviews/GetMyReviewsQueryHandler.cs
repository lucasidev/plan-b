using Planb.Academic.Application.Contracts;
using Planb.Reviews.Application.Abstractions.Persistence;

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
/// </summary>
public static class GetMyReviewsQueryHandler
{
    /// <summary>Lo que se muestra cuando el catálogo no tiene el id que la reseña guardó.</summary>
    private const string Unknown = "Sin vincular";

    public static async Task<IReadOnlyList<MyReviewView>> Handle(
        Guid accountId,
        IMyReviewsQueryService reviews,
        IAcademicQueryService academic,
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

        return rows
            .Select(r =>
            {
                var subject = labels.Subjects.GetValueOrDefault(r.SubjectId);

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
                    r.Answers,
                    r.FreeText,
                    r.CreatedAt,
                    r.UpdatedAt);
            })
            .ToList();
    }
}
