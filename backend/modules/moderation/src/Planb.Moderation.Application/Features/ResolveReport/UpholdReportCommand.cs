namespace Planb.Moderation.Application.Features.ResolveReport;

/// <summary>
/// Uphold de un report (US-051): el moderador decide que la reseña viola la política. Cascadea a los
/// otros reports open de la misma reseña (mecanismo de la versión anterior del producto, en retiro:
/// ADR-0063) y dispara la remoción de la reseña.
/// </summary>
public sealed record UpholdReportCommand(
    Guid ReportId,
    Guid ModeratorUserId,
    string? ResolutionNote);
