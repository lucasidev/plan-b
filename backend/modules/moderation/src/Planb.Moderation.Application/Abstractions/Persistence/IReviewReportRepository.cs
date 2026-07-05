using Planb.Moderation.Domain.Reports;

namespace Planb.Moderation.Application.Abstractions.Persistence;

/// <summary>
/// Write + minimal-read repository for <see cref="ReviewReport"/>. The two read helpers
/// support the report flow: the duplicate pre-check (one report per reviewer per review)
/// and the open-count used to decide auto-hide (ADR-0010 threshold).
/// </summary>
public interface IReviewReportRepository
{
    void Add(ReviewReport report);

    Task<bool> ExistsAsync(Guid reviewId, Guid reporterUserId, CancellationToken ct = default);

    Task<int> CountOpenForReviewAsync(Guid reviewId, CancellationToken ct = default);

    /// <summary>Carga un report por id para resolverlo (US-051). Null si no existe.</summary>
    Task<ReviewReport?> FindByIdAsync(ReviewReportId id, CancellationToken ct = default);

    /// <summary>
    /// Todos los reports <see cref="ReviewReportStatus.Open"/> de una reseña (US-051). El uphold los
    /// cascadea a Upheld juntos (ADR-0011); el dismiss lo usa para saber si queda alguno abierto.
    /// </summary>
    Task<IReadOnlyList<ReviewReport>> GetOpenByReviewAsync(
        Guid reviewId, CancellationToken ct = default);
}
