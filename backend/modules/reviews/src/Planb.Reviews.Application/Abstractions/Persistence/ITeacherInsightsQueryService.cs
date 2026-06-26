using Planb.Reviews.Application.Features.TeacherInsights;

namespace Planb.Reviews.Application.Abstractions.Persistence;

/// <summary>
/// Read-side de los crowd insights de un docente (US-003): agregados sobre las reseñas Published
/// donde el docente fue el <c>docente_reseñado_id</c>. Dapper, una query.
/// </summary>
public interface ITeacherInsightsQueryService
{
    Task<TeacherReviewInsights> GetForTeacherAsync(Guid teacherId, CancellationToken ct = default);
}
