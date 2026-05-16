using Planb.Academic.Domain.CareerPlanImports;

namespace Planb.Academic.Application.Features.CareerPlanImports;

/// <summary>
/// Comando del POST /api/me/career-plan-imports. El endpoint Carter decide cómo lo arma según
/// el content-type: multipart → bytes en <see cref="PdfBytes"/> con
/// <see cref="CareerPlanImportSourceType.Pdf"/>; JSON con <c>rawText</c> → string en
/// <see cref="RawText"/> con <see cref="CareerPlanImportSourceType.Text"/>.
/// </summary>
public sealed record CreateCareerPlanImportCommand(
    Guid UserId,
    Guid UniversityId,
    string CareerName,
    int PlanYear,
    int StudentEnrollmentYear,
    CareerPlanImportSourceType SourceType,
    byte[]? PdfBytes,
    string? RawText);
