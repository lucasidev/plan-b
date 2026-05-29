using System.Reflection;
using System.Text.RegularExpressions;
using Planb.Reviews.Application.Abstractions.ContentFilter;

namespace Planb.Reviews.Infrastructure.ContentFilter;

/// <summary>
/// Implementación del filter de contenido basada en regex sobre una blacklist embebida
/// (<c>ContentFilter/blacklist.txt</c>) más unos patrones de PII (email, teléfono, DNI).
///
/// <para>
/// El compilado ocurre una vez en el constructor, por eso esta clase se registra como
/// singleton. Evaluar es una llamada a <see cref="Regex.IsMatch(string)"/> que recorre el
/// texto una sola vez (motor compilado), bajo control de tiempo (<c>TimeSpan</c> de 200ms
/// para defensa contra ReDoS a futuro si se vuelven patrones complejos).
/// </para>
///
/// <para>
/// Filosofía: el filter es un primer filtro grueso, no una verdad. Cuando triggerea, la
/// review entra a <c>UnderReview</c> y un moderador humano decide. Por eso la blacklist se
/// mantiene conservadora: preferimos falsos positivos a falsos negativos, pero no tanto
/// que cada review caiga en cola.
/// </para>
/// </summary>
public sealed class RegexReviewContentFilter : IReviewContentFilter
{
    private static readonly TimeSpan MatchTimeout = TimeSpan.FromMilliseconds(200);
    private const string BlacklistResource = "Planb.Reviews.Infrastructure.ContentFilter.blacklist.txt";

    private readonly Regex? _blacklist;
    private readonly IReadOnlyList<(string Name, Regex Pattern)> _piiRules;

    public RegexReviewContentFilter()
    {
        _blacklist = BuildBlacklistRegex();
        _piiRules = BuildPiiRules();
    }

    public ContentFilterResult Evaluate(string? subjectText, string? teacherText)
    {
        var triggered = new List<string>();

        // Concatenamos para evaluar una sola vez por regla. El callee no necesita saber en
        // qué campo cayó: la decisión solo importa al status (Clean / UnderReview).
        var combined = string.Join(
            "\n",
            new[] { subjectText, teacherText }.Where(t => !string.IsNullOrWhiteSpace(t)));

        if (string.IsNullOrWhiteSpace(combined))
        {
            return ContentFilterResult.Clean();
        }

        if (_blacklist is not null && _blacklist.IsMatch(combined))
        {
            triggered.Add("blacklist");
        }

        foreach (var rule in _piiRules)
        {
            if (rule.Pattern.IsMatch(combined))
            {
                triggered.Add(rule.Name);
            }
        }

        return triggered.Count == 0
            ? ContentFilterResult.Clean()
            : ContentFilterResult.Triggered(triggered);
    }

    /// <summary>
    /// Lee la blacklist embebida y construye un único regex <c>\b(word1|word2|...)\b</c> con
    /// flags <c>IgnoreCase | Compiled | CultureInvariant</c>. Si el archivo no existe o
    /// queda vacío después de filtrar comentarios, retorna null y el filter se comporta como
    /// "blacklist desactivada" (sigue corriendo las reglas de PII).
    /// </summary>
    private static Regex? BuildBlacklistRegex()
    {
        var assembly = typeof(RegexReviewContentFilter).Assembly;
        using var stream = assembly.GetManifestResourceStream(BlacklistResource);
        if (stream is null)
        {
            return null;
        }

        using var reader = new StreamReader(stream);
        var words = new List<string>();
        while (reader.ReadLine() is { } line)
        {
            var trimmed = line.Trim();
            if (trimmed.Length == 0 || trimmed.StartsWith('#'))
            {
                continue;
            }
            words.Add(Regex.Escape(trimmed));
        }

        if (words.Count == 0)
        {
            return null;
        }

        var pattern = $@"\b(?:{string.Join('|', words)})\b";
        return new Regex(
            pattern,
            RegexOptions.IgnoreCase | RegexOptions.Compiled | RegexOptions.CultureInvariant,
            MatchTimeout);
    }

    /// <summary>
    /// Reglas de detección de PII. La intención no es ser exhaustivo (eso es para una US
    /// futura específica), sino atrapar lo obvio: emails, números de teléfono argentinos,
    /// y DNI/CUIT formato común.
    /// </summary>
    private static IReadOnlyList<(string Name, Regex Pattern)> BuildPiiRules()
    {
        var options = RegexOptions.IgnoreCase | RegexOptions.Compiled | RegexOptions.CultureInvariant;
        return
        [
            // Email genérico (RFC simplificado).
            ("pii:email",
                new Regex(
                    @"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b",
                    options,
                    MatchTimeout)),

            // Teléfono argentino: opcional +54, opcional 9 móvil, código de área 2 a 4 dígitos,
            // número 6 a 8 dígitos con separadores opcionales. Cubre fijos y móviles.
            ("pii:phone",
                new Regex(
                    @"(?:\+?54[\s\-]?)?(?:9[\s\-]?)?(?:\(?\d{2,4}\)?[\s\-]?)?\d{3,4}[\s\-]?\d{4}",
                    options,
                    MatchTimeout)),

            // DNI argentino: 7 u 8 dígitos, con o sin puntos cada 3.
            ("pii:dni",
                new Regex(
                    @"\b\d{1,2}\.?\d{3}\.?\d{3}\b",
                    options,
                    MatchTimeout)),
        ];
    }
}
