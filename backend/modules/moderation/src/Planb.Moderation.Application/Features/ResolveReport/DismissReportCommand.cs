namespace Planb.Moderation.Application.Features.ResolveReport;

/// <summary>
/// Dismiss de un report (US-051): el moderador decide que la crítica es legítima, la reseña se queda.
/// Cierra solo este report; si era el último open de la reseña, avisa a Reviews (puede restaurar).
/// </summary>
public sealed record DismissReportCommand(
    Guid ReportId,
    Guid ModeratorUserId,
    string? ResolutionNote);
