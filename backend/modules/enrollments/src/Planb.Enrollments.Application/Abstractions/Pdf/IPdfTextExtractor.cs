namespace Planb.Enrollments.Application.Abstractions.Pdf;

/// <summary>
/// Port para extraer texto plano de un PDF binario. La impl concreta usa <c>UglyToad.PdfPig</c>
/// (en Infrastructure), pero el handler no la conoce — solo pide texto. Eso permite testear
/// el handler sin PDFs reales (los unit tests del parser mockean este port con texto preset).
///
/// <para>
/// El extractor NO interpreta el contenido. Solo devuelve texto crudo (concat de páginas) +
/// metadata (count de páginas, si está encriptado). El parseo de materias / notas / cuatris
/// es responsabilidad de <c>IHistorialParser</c>, que opera sobre el texto.
/// </para>
/// </summary>
public interface IPdfTextExtractor
{
    PdfExtractionResult Extract(ReadOnlySpan<byte> pdfBytes);
}

/// <summary>
/// Resultado del extract. Si <see cref="IsEncrypted"/>, el handler aborta con 422 y NO usa
/// <see cref="Text"/> (que va a estar vacío). Si <see cref="PageCount"/> = 0, el PDF está
/// roto o vacío → también error.
/// </summary>
public sealed record PdfExtractionResult(
    string Text,
    int PageCount,
    bool IsEncrypted);
