using Planb.Academic.Domain.CareerPlanImports;

namespace Planb.Academic.Application.Features.CareerPlanImports;

/// <summary>
/// Mensaje async para el worker Wolverine. Los PdfBytes viajan por el outbox de Postgres cuando
/// SourceType=Pdf; aceptable para MVP.
/// </summary>
public sealed record ProcessCareerPlanImportCommand(
    Guid ImportId,
    CareerPlanImportSourceType SourceType,
    byte[]? PdfBytes,
    string? RawText);
