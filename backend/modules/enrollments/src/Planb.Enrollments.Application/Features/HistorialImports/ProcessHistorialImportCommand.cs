using Planb.Enrollments.Domain.HistorialImports;

namespace Planb.Enrollments.Application.Features.HistorialImports;

/// <summary>
/// Mensaje async que dispara el handler del POST. Lo recibe el worker de Wolverine y procesa
/// el aggregate (extrae texto si es PDF, corre el parser, persiste el resultado).
///
/// Los bytes del PDF viajan en este mensaje cuando <see cref="SourceType"/>=Pdf. Como Wolverine
/// puede serializar a Postgres outbox, los bytes pesados (hasta 5MB) viajan por el outbox.
/// Trade-off aceptable porque MVP: bajo volumen. Si crece, mover los bytes a blob storage
/// (S3 / Azure Blob) y pasar solo la URL.
/// </summary>
public sealed record ProcessHistorialImportCommand(
    Guid ImportId,
    HistorialImportSourceType SourceType,
    byte[]? PdfBytes,
    string? RawText);
