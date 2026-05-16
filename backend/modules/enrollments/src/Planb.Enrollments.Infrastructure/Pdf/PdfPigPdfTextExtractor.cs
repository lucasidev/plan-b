using System.Text;
using Planb.Enrollments.Application.Abstractions.Pdf;
using UglyToad.PdfPig;
using UglyToad.PdfPig.Content;
using UglyToad.PdfPig.Exceptions;

namespace Planb.Enrollments.Infrastructure.Pdf;

/// <summary>
/// Impl con <c>UglyToad.PdfPig</c>. Extrae texto plano concatenando todas las páginas,
/// separadas por <c>\n\n</c> para que el parser pueda usar saltos de página como pista
/// (el SIU típicamente arranca cada sección en página nueva).
///
/// <para>
/// PdfPig NO renderea: solo lee el text layer del PDF. Si el PDF es una imagen escaneada
/// (sin text layer), <see cref="Extract"/> devuelve texto vacío y el caller decide rechazar
/// (validación arriba en el endpoint).
/// </para>
/// </summary>
internal sealed class PdfPigPdfTextExtractor : IPdfTextExtractor
{
    public PdfExtractionResult Extract(ReadOnlySpan<byte> pdfBytes)
    {
        if (pdfBytes.IsEmpty)
        {
            return new PdfExtractionResult(string.Empty, 0, false);
        }

        var copy = pdfBytes.ToArray();

        try
        {
            using var doc = PdfDocument.Open(copy);
            var sb = new StringBuilder(capacity: Math.Min(pdfBytes.Length, 8192));

            foreach (Page page in doc.GetPages())
            {
                sb.Append(page.Text);
                sb.Append("\n\n");
            }

            return new PdfExtractionResult(
                Text: sb.ToString(),
                PageCount: doc.NumberOfPages,
                IsEncrypted: false);
        }
        catch (PdfDocumentEncryptedException)
        {
            return new PdfExtractionResult(string.Empty, 0, IsEncrypted: true);
        }
    }
}
