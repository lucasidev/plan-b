namespace Planb.Reviews.Application.Constants;

/// <summary>
/// Canonical set of review tags (US-089). These mirror the editor taxonomy that ships in the
/// frontend (<c>features/write-review/data/mocks.ts</c>, flagged as provisional in ADR-0041);
/// they are user-facing content values, not code identifiers, so they stay in Spanish. The
/// validator rejects any tag outside this set so the corpus the US-002 crowd insights aggregate
/// over stays clean. When the definitive taxonomy lands, this single constant changes.
/// </summary>
public static class AllowedTags
{
    public static readonly IReadOnlyList<string> All =
    [
        "claro explicando",
        "exige pero acompaña",
        "pide mucho",
        "responde tarde",
        "TPs bien armados",
        "parciales justos",
        "parciales difíciles",
        "aprueba justo",
        "cercano con alumnos",
        "flexible con entregas",
        "estructura ordenada",
        "material desactualizado",
    ];

    /// <summary>Max tags a single review can carry. Mirrors the editor cap (12 = the full set).</summary>
    public const int MaxPerReview = 12;

    private static readonly HashSet<string> Lookup = new(All, StringComparer.Ordinal);

    public static bool IsAllowed(string tag) => Lookup.Contains(tag);
}
