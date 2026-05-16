namespace Planb.Academic.Application.Abstractions.Pdf;

/// <summary>
/// Port para extraer texto plano de un PDF binario. La impl concreta usa <c>UglyToad.PdfPig</c>
/// (en Infrastructure), pero el handler no la conoce — solo pide texto. Mismo contrato que el
/// port homónimo en Enrollments.Application (US-014); ambos sobreviven duplicados como deuda
/// técnica menor hasta que aterrice un consolidador (TODO: extraer a SharedKernel cuando haya
/// un tercer caller).
/// </summary>
public interface IPdfTextExtractor
{
    PdfExtractionResult Extract(ReadOnlySpan<byte> pdfBytes);
}

public sealed record PdfExtractionResult(
    string Text,
    int PageCount,
    bool IsEncrypted);
