using System.Security.Cryptography;

namespace Planb.Academic.Infrastructure.CatalogImport;

public static class ReviewedCatalogSnapshot
{
    // El operador selecciona un archivo, pero el binario solo acepta la captura revisada junto al código.
    // Cambiar los datos exige revisar y versionar también su checksum, como en el ZIP SPU.
    public static async Task VerifyAsync(Stream stream, CancellationToken ct = default)
    {
        using var expectedStream = typeof(ReviewedCatalogSnapshot).Assembly.GetManifestResourceStream(
            "Planb.Academic.Infrastructure.CatalogImport.Data.siu-national.sha256")
            ?? throw new InvalidDataException("Reviewed SIU checksum missing");
        using var reader = new StreamReader(expectedStream);
        var expected = (await reader.ReadToEndAsync(ct)).Trim();
        var actual = Convert.ToHexString(await SHA256.HashDataAsync(stream, ct));
        if (!actual.Equals(expected, StringComparison.OrdinalIgnoreCase))
            throw new InvalidDataException("SIU snapshot differs from the reviewed capture. Review and version the new capture and checksum before importing.");
    }
}
