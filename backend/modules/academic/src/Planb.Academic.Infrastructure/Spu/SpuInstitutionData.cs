using System.Globalization;
using System.IO.Compression;
using System.Security.Cryptography;
using System.Text.Json;

namespace Planb.Academic.Infrastructure.Spu;

public sealed record SpuInstitutionData(string Institution, string Sector, string SourceName,
    string SourceGroup, long? Students, long? Graduates);

public static class SpuInstitutionSnapshot
{
    public const string SourceUrl = "https://www.argentina.gob.ar/sites/default/files/2020/04/anuario_csv_2022.zip";
    public static readonly DateTimeOffset RetrievedAt = new(2026, 9, 17, 0, 0, 0, TimeSpan.Zero);
    private const string ArchiveHash = "768849612AADD49746BBF6CCE8B2C74E875256658B362597F47DE76D2EB33854";

    public static IReadOnlyList<SpuInstitutionData> Load()
    {
        using var source = OpenResource("anuario_csv_2022.zip");
        using var memory = new MemoryStream();
        source.CopyTo(memory);
        if (Convert.ToHexString(SHA256.HashData(memory.ToArray())) != ArchiveHash)
            throw new InvalidDataException("SPU archive checksum mismatch");
        memory.Position = 0;
        using var archive = new ZipArchive(memory);
        using var identities = OpenResource("siu-identities.json");
        var aliases = JsonSerializer.Deserialize<Identity[]>(identities, new JsonSerializerOptions(JsonSerializerDefaults.Web))
            ?? throw new InvalidDataException("SPU identities missing");
        if (aliases.Select(x => x.Institution).Distinct().Count() != aliases.Length)
            throw new InvalidDataException("Duplicate SIU institution in SPU identities");
        var tables = new Dictionary<string, IReadOnlyDictionary<string, long?>>(StringComparer.Ordinal);
        foreach (var sector in new[] { "Estatal", "Privado" })
        {
            foreach (var measure in new[] { 1, 3 })
            {
                var number = sector == "Estatal" ? 1 : 2;
                var file = $"Cuadro_2_{number}_{measure}.csv";
                var entry = archive.Entries.Single(e => e.FullName.EndsWith('/' + file, StringComparison.Ordinal));
                using var reader = new StreamReader(entry.Open());
                tables.Add($"{sector}/{measure}", ReadTable(reader));
            }
        }
        return aliases.Select(alias => new SpuInstitutionData(alias.Institution, alias.Sector,
            alias.SpuName, alias.Group,
            Lookup(tables[$"{alias.Sector}/1"], alias),
            Lookup(tables[$"{alias.Sector}/3"], alias))).ToArray();
    }

    // nombre_corto se repite entre universidades e institutos (Gran Rosario): el grupo es parte de la identidad.
    internal static IReadOnlyDictionary<string, long?> ReadTable(TextReader reader)
    {
        var header = reader.ReadLine()?.Split('|') ?? [];
        var yearIndex = Array.IndexOf(header, "_2022");
        if (header.FirstOrDefault() != "nombre_corto" || yearIndex < 0)
            throw new InvalidDataException("Unexpected SPU table columns");
        var rows = new Dictionary<string, long?>(StringComparer.Ordinal);
        string? group = null;
        while (reader.ReadLine() is { } line)
        {
            if (string.IsNullOrWhiteSpace(line)) continue;
            var cells = line.Split('|');
            if (cells.Length != header.Length) throw new InvalidDataException("Truncated SPU row");
            var name = cells[0].Trim();
            if (name.StartsWith("Total ", StringComparison.Ordinal)) { group = name; continue; }
            if (string.IsNullOrWhiteSpace(name) || group is null) throw new InvalidDataException("SPU identity missing");
            long? value = null;
            if (!string.IsNullOrWhiteSpace(cells[yearIndex]))
            {
                if (!long.TryParse(cells[yearIndex], NumberStyles.None, CultureInfo.InvariantCulture, out var count))
                    throw new InvalidDataException("Invalid SPU count");
                value = count;
            }
            if (!rows.TryAdd($"{group}/{name}", value)) throw new InvalidDataException("Duplicate SPU institution");
        }
        return rows;
    }

    private static long? Lookup(IReadOnlyDictionary<string, long?> table, Identity alias) =>
        table.TryGetValue($"{alias.Group}/{alias.SpuName}", out var count) ? count
            : throw new InvalidDataException($"SPU alias not found: {alias.Institution}");

    private static Stream OpenResource(string suffix) => typeof(SpuInstitutionSnapshot).Assembly
        .GetManifestResourceStream($"Planb.Academic.Infrastructure.Spu.Data.{suffix}")
        ?? throw new InvalidDataException($"SPU resource missing: {suffix}");

    private sealed record Identity(string Institution, string SpuName, string Sector, string Group);
}
