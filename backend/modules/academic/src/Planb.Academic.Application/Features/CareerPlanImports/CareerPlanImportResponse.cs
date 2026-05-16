using Planb.Academic.Domain.CareerPlanImports;

namespace Planb.Academic.Application.Features.CareerPlanImports;

/// <summary>
/// DTO del GET /api/me/career-plan-imports/{id}. Shape plano para serializar HTTP.
/// </summary>
public sealed record CareerPlanImportResponse(
    Guid Id,
    Guid UniversityId,
    string CareerName,
    int PlanYear,
    int StudentEnrollmentYear,
    string SourceType,
    string Status,
    string? Error,
    Guid? ApprovedCareerPlanId,
    CareerPlanImportPayloadDto? Payload,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ParsedAt,
    DateTimeOffset? ApprovedAt);

public sealed record CareerPlanImportPayloadDto(
    IReadOnlyList<ParsedSubjectItemDto> Items,
    CareerPlanImportSummaryDto Summary);

public sealed record ParsedSubjectItemDto(
    int Index,
    string RawRow,
    string? DetectedCode,
    string? DetectedName,
    int? DetectedYearInPlan,
    int? DetectedTermInYear,
    string? DetectedTermKind,
    string Confidence,
    IReadOnlyList<string> Issues);

public sealed record CareerPlanImportSummaryDto(
    int TotalDetected,
    int HighConfidence,
    int MediumConfidence,
    int LowConfidence);

internal static class CareerPlanImportResponseExtensions
{
    public static CareerPlanImportResponse ToResponse(this CareerPlanImport import)
    {
        CareerPlanImportPayloadDto? payload = null;
        if (import.Payload is not null)
        {
            payload = new CareerPlanImportPayloadDto(
                Items: import.Payload.Items.Select(i => new ParsedSubjectItemDto(
                    i.Index, i.RawRow, i.DetectedCode, i.DetectedName,
                    i.DetectedYearInPlan, i.DetectedTermInYear, i.DetectedTermKind,
                    i.Confidence.ToString(), i.Issues)).ToList(),
                Summary: new CareerPlanImportSummaryDto(
                    import.Payload.Summary.TotalDetected,
                    import.Payload.Summary.HighConfidence,
                    import.Payload.Summary.MediumConfidence,
                    import.Payload.Summary.LowConfidence));
        }

        return new CareerPlanImportResponse(
            Id: import.Id.Value,
            UniversityId: import.UniversityId.Value,
            CareerName: import.CareerName,
            PlanYear: import.PlanYear,
            StudentEnrollmentYear: import.StudentEnrollmentYear,
            SourceType: import.SourceType.ToString(),
            Status: import.Status.ToString(),
            Error: import.Error,
            ApprovedCareerPlanId: import.ApprovedCareerPlanId,
            Payload: payload,
            CreatedAt: import.CreatedAt,
            ParsedAt: import.ParsedAt,
            ApprovedAt: import.ApprovedAt);
    }
}
