namespace Planb.Enrollments.Domain.HistorialImports;

/// <summary>
/// Origen del payload que el alumno subió. <see cref="Pdf"/> = upload binario que se extrae con
/// PdfPig. <see cref="Text"/> = paste directo en un textarea (sin parseo de PDF, va directo al
/// parser heurístico).
///
/// <para>
/// No incluimos OCR / image-based: si el PDF no tiene text layer, el endpoint rechaza con 422.
/// Cuando aterrice OCR (post-MVP), se agrega un valor <c>Image</c> + un extractor distinto.
/// </para>
/// </summary>
public enum HistorialImportSourceType
{
    Pdf,
    Text,
}
