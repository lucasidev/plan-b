using System.Text;
using Planb.Academic.Application.Abstractions.Pdf;
using UglyToad.PdfPig;
using UglyToad.PdfPig.Content;
using UglyToad.PdfPig.Exceptions;

namespace Planb.Academic.Infrastructure.Pdf;

/// <summary>
/// Impl con <c>UglyToad.PdfPig</c>. Replicada del módulo Enrollments (US-014) porque a la fecha
/// no hay un proyecto compartido donde alojarla. TODO: cuando aterrice una tercera US que pida
/// extraction de PDF, consolidar las 2 impls en <c>libs/shared-kernel</c> o un nuevo proyecto
/// <c>Planb.Infrastructure.Common.Pdf</c>.
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
