namespace Planb.Moderation.Application.Features.ResolveReport;

/// <summary>
/// Resultado de resolver un report (US-051). <see cref="CascadedCount"/> = otros reports cerrados por
/// cascade (solo en uphold; 0 en dismiss).
/// </summary>
public sealed record ResolveReportResponse(Guid ReportId, string Status, int CascadedCount);
