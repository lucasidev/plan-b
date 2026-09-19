namespace Planb.Academic.Infrastructure.CatalogImport;

public static class SiuCatalogSnapshotValidator
{
    public const string SourceUrl = "https://guiadecarreras.siu.edu.ar";

    private static readonly string[] ProvinceCodes =
    [
        "B", "K", "H", "U", "C", "X", "W", "E", "P", "Y", "L", "F", "M", "N", "Q", "R",
        "A", "J", "D", "Z", "S", "G", "V", "T",
    ];

    private static readonly string[] Levels = ["undergraduate", "postgraduate"];

    public static IReadOnlyList<string> Validate(SiuCatalogSnapshot snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        var errors = new List<string>();
        if (snapshot.SchemaVersion != 1) errors.Add("schemaVersion must be 1.");
        if (string.IsNullOrWhiteSpace(snapshot.SourceUrl)
            || !string.Equals(snapshot.SourceUrl.TrimEnd('/'), SourceUrl, StringComparison.Ordinal))
            errors.Add("sourceUrl must be the SIU guide root.");
        if (snapshot.RetrievedAt == default) errors.Add("retrievedAt is required.");
        if (snapshot.Coverage is null || snapshot.Offerings is null
            || snapshot.Coverage.Any(c => c is null) || snapshot.Offerings.Any(o => o is null))
        {
            errors.Add("coverage and offerings must be non-null arrays with non-null entries.");
            return errors;
        }
        if (snapshot.Offerings.Count == 0) errors.Add("The national catalog cannot be empty.");

        var expected = ProvinceCodes.SelectMany(code => Levels.Select(level => $"{code}|{level}"))
            .ToHashSet(StringComparer.Ordinal);
        var seen = new HashSet<string>(StringComparer.Ordinal);
        foreach (var coverage in snapshot.Coverage)
        {
            var key = $"{coverage.ProvinceCode}|{coverage.Level}";
            if (!expected.Contains(key)) errors.Add($"Unexpected coverage pair {key}.");
            if (!seen.Add(key)) errors.Add($"Repeated coverage pair {key}.");
            if (coverage.Count < 0) errors.Add($"Negative count for {key}.");
            if (!IsOfficialUrl(coverage)) errors.Add($"Coverage URL does not match the SIU province and level for {key}.");
            if (string.IsNullOrWhiteSpace(coverage.Sha256) || coverage.Sha256.Length != 64 || !coverage.Sha256.All(Uri.IsHexDigit))
                errors.Add($"Invalid sha256 for {key}.");
        }
        if (!seen.SetEquals(expected)) errors.Add("Coverage must contain the 48 province and level pairs exactly once.");

        foreach (var group in snapshot.Offerings.GroupBy(o => $"{o.ProvinceCode}|{o.Level}", StringComparer.Ordinal))
        {
            if (!expected.Contains(group.Key)) errors.Add($"Unexpected offering pair {group.Key}.");
            var coverage = snapshot.Coverage.FirstOrDefault(c => $"{c.ProvinceCode}|{c.Level}" == group.Key);
            if (coverage is null || coverage.Count != group.Count())
                errors.Add($"Offering count does not match coverage for {group.Key}.");
        }

        foreach (var coverage in snapshot.Coverage)
        {
            var count = snapshot.Offerings.Count(o => o.ProvinceCode == coverage.ProvinceCode && o.Level == coverage.Level);
            if (count != coverage.Count) errors.Add($"Offering count does not match coverage for {coverage.ProvinceCode}|{coverage.Level}.");
        }
        return errors;
    }

    private static bool IsOfficialUrl(SiuCatalogCoverage coverage)
    {
        if (!Uri.TryCreate(coverage.Url, UriKind.Absolute, out var uri)
            || uri.Scheme != Uri.UriSchemeHttps || uri.Host != "guiadecarreras.siu.edu.ar"
            || !uri.IsDefaultPort || uri.UserInfo.Length != 0) return false;
        var path = coverage.Level == "undergraduate" ? "guia_grado.php" : "guia_postgrado.php";
        if (uri.AbsolutePath != "/ciie_ofertas/2.0/" + path) return false;
        var pairs = uri.Query.TrimStart('?').Split('&').Select(p => p.Split('=', 2)).ToArray();
        var provinces = pairs.Where(p => p[0] == "provincia").ToArray();
        var levels = pairs.Where(p => p[0] == "nivel").ToArray();
        return provinces.Length == 1 && provinces[0].Length == 2 && provinces[0][1] == coverage.ProvinceCode
            && levels.Length == 1 && levels[0].Length == 2 && levels[0][1] == (coverage.Level == "undergraduate" ? "1" : "2");
    }
}
