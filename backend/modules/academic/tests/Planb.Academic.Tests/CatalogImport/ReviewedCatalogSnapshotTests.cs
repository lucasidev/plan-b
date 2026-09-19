using System.Text.Json;
using Planb.Academic.Infrastructure.CatalogImport;
using Shouldly;
using Xunit;

namespace Planb.Academic.Tests.CatalogImport;

public sealed class ReviewedCatalogSnapshotTests
{
    [Fact]
    public async Task A_modified_snapshot_is_rejected_even_with_original_coverage_and_page_hashes()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "CatalogImport", "Data", "siu-national.json");
        var document = JsonSerializer.Deserialize<SiuCatalogSnapshot>(await File.ReadAllTextAsync(path),
            new JsonSerializerOptions(JsonSerializerDefaults.Web))!;
        var changed = document with { Offerings = [document.Offerings[0] with { Title = "Invented title" }, .. document.Offerings.Skip(1)] };
        await using var stream = new MemoryStream(JsonSerializer.SerializeToUtf8Bytes(changed,
            new JsonSerializerOptions(JsonSerializerDefaults.Web)));
        await Should.ThrowAsync<InvalidDataException>(() => ReviewedCatalogSnapshot.VerifyAsync(stream));
    }
}
