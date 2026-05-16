using Planb.Enrollments.Domain.HistorialImports;

namespace Planb.Enrollments.Application.Features.HistorialImports;

/// <summary>
/// Comando del POST /api/me/historial-imports. El endpoint Carter decide cómo arma el payload:
/// si vino un multipart con PDF, baja bytes y pasa <see cref="HistorialImportSourceType.Pdf"/>;
/// si vino body texto, pasa el string como <see cref="RawText"/> y <see cref="SourceType.Text"/>.
///
/// El handler crea el aggregate en estado <see cref="HistorialImportStatus.Pending"/>, encola
/// el procesamiento (Wolverine envía <c>ProcessHistorialImportCommand</c>) y responde 202 con
/// el id para que el frontend haga polling al GET.
/// </summary>
public sealed record CreateHistorialImportCommand(
    Guid UserId,
    HistorialImportSourceType SourceType,
    byte[]? PdfBytes,
    string? RawText);
