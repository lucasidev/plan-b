using Planb.Enrollments.Domain.HistorialImports;

namespace Planb.Enrollments.Application.Features.HistorialImports;

/// <summary>
/// DTO del GET /api/me/historial-imports/{id}. Shape plano, no expone el aggregate completo.
/// El frontend usa esto para hacer polling al status + renderear el preview cuando ya está
/// parseado.
/// </summary>
public sealed record HistorialImportResponse(
    Guid Id,
    string SourceType,
    string Status,
    string? Error,
    HistorialImportPayloadDto? Payload,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ParsedAt,
    DateTimeOffset? ConfirmedAt);

/// <summary>
/// Shape DTO del payload (mismo schema que el JSONB pero sin acoplarse al record interno
/// del Domain). Es JSON-friendly y serializable directo a HTTP.
/// </summary>
public sealed record HistorialImportPayloadDto(
    IReadOnlyList<ParsedItemDto> Items,
    HistorialImportSummaryDto Summary);

public sealed record ParsedItemDto(
    int Index,
    string RawRow,
    string? DetectedCode,
    decimal? DetectedGrade,
    string? DetectedStatus,
    string? DetectedApprovalMethod,
    int? DetectedYear,
    int? DetectedTermNumber,
    Guid? SubjectId,
    string? SubjectName,
    Guid? TermId,
    string? TermLabel,
    string Confidence,
    IReadOnlyList<string> Issues);

public sealed record HistorialImportSummaryDto(
    int TotalDetected,
    int HighConfidence,
    int MediumConfidence,
    int LowConfidence);

internal static class HistorialImportResponseExtensions
{
    public static HistorialImportResponse ToResponse(this HistorialImport import)
    {
        HistorialImportPayloadDto? payload = null;
        if (import.Payload is not null)
        {
            payload = new HistorialImportPayloadDto(
                Items: import.Payload.Items.Select(i => new ParsedItemDto(
                    i.Index, i.RawRow, i.DetectedCode, i.DetectedGrade, i.DetectedStatus,
                    i.DetectedApprovalMethod, i.DetectedYear, i.DetectedTermNumber,
                    i.SubjectId, i.SubjectName, i.TermId, i.TermLabel,
                    i.Confidence.ToString(), i.Issues)).ToList(),
                Summary: new HistorialImportSummaryDto(
                    import.Payload.Summary.TotalDetected,
                    import.Payload.Summary.HighConfidence,
                    import.Payload.Summary.MediumConfidence,
                    import.Payload.Summary.LowConfidence));
        }

        return new HistorialImportResponse(
            Id: import.Id.Value,
            SourceType: import.SourceType.ToString(),
            Status: import.Status.ToString(),
            Error: import.Error,
            Payload: payload,
            CreatedAt: import.CreatedAt,
            ParsedAt: import.ParsedAt,
            ConfirmedAt: import.ConfirmedAt);
    }
}
