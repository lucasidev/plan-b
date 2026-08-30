namespace Planb.Academic.Application.Abstractions.Pdf;

/// <summary>
/// Port para extraer texto plano de un PDF binario. La impl concreta usa <c>UglyToad.PdfPig</c>
/// (en Infrastructure), pero el handler no la conoce: solo pide texto.
/// </summary>
public interface IPdfTextExtractor
{
    PdfExtractionResult Extract(ReadOnlySpan<byte> pdfBytes);
}

public sealed record PdfExtractionResult(
    string Text,
    int PageCount,
    bool IsEncrypted);
