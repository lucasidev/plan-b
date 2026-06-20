using Planb.Reviews.Application.Features.SubjectInsights;

namespace Planb.Reviews.Application.Abstractions.Persistence;

/// <summary>
/// Read-side de los crowd insights de una materia (US-002): agregados sobre las reseñas
/// Published ancladas a esa materia (vía enrollment.subject_id). Dapper, una query.
/// </summary>
public interface ISubjectInsightsQueryService
{
    Task<SubjectReviewInsights> GetForSubjectAsync(Guid subjectId, CancellationToken ct = default);
}
