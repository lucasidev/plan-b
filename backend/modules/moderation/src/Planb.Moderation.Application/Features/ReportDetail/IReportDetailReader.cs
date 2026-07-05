namespace Planb.Moderation.Application.Features.ReportDetail;

/// <summary>
/// Read del detalle de un report (US-051). Query cross-schema (moderation + reviews + enrollments +
/// identity), permitido por ADR-0017 para reads. Reader interno del feature. Null si el report no
/// existe.
/// </summary>
public interface IReportDetailReader
{
    Task<ReportDetailResponse?> GetAsync(Guid reportId, CancellationToken ct = default);
}
