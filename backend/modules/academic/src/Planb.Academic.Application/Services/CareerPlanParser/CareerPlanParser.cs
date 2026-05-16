using System.Globalization;
using System.Text.RegularExpressions;
using Planb.Academic.Domain.CareerPlanImports;

namespace Planb.Academic.Application.Services.CareerPlanParser;

/// <summary>
/// Parser heurístico de planes de estudio (US-088). Trabaja sobre texto crudo (PDF extraído o
/// pegado por el alumno) y detecta materias con código + nombre + año en plan + cuatrimestre.
///
/// <para>
/// Estrategia: trackea encabezados de sección que indican "año X" y "cuatrimestre Y", y atribuye
/// cada línea-materia al año/cuatrimestre actual. Si una línea-materia incluye explícitamente
/// el año + cuatrimestre inline, prevalece sobre el contexto del header.
/// </para>
///
/// <para>
/// Out of scope MVP: correlativas (las carga el admin desde backoffice post-MVP), carga horaria.
/// Si el PDF las trae, las ignoramos (defaults sensatos se aplicaron al materializar las
/// Subjects).
/// </para>
///
/// <para>
/// El parser NUNCA tira: lo peor que devuelve es un payload con <c>Items = []</c>. Resilience
/// total contra inputs raros.
/// </para>
/// </summary>
public sealed class CareerPlanParser : ICareerPlanParser
{
    // Código de materia: 2-5 letras MAYÚSCULAS + opcional guión + 2-4 dígitos.
    private static readonly Regex CodeRegex = new(
        @"\b([A-Z]{2,5})-?(\d{2,4})\b",
        RegexOptions.Compiled);

    // Encabezado de "AÑO X": "1° año", "Primer año", "1er año", "Año 1", "Año 1°".
    // Match en grupo 1 (1°/1er/primer/etc.) o 2 (Año 1).
    private static readonly Regex YearHeaderRegex = new(
        @"\b(?:(\d|primer|segundo|tercer|cuarto|quinto|sexto|septimo|octavo)[º°.]?(?:\s*er|\s*do|\s*to|\s*mo|\s*vo|\s*no)?\s*a[ñn]o|a[ñn]o\s*(\d)[º°.]?)\b",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    // Encabezado de cuatrimestre: "1° cuatri", "Primer cuatrimestre", "1er cuatri", "1c", "2c".
    private static readonly Regex TermHeaderRegex = new(
        @"\b(?:(\d|primer|segundo)[º°.]?(?:\s*er|\s*do)?\s*cuatr\w*|(\d)\s*[Cc])\b",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    // Detectar mention de "anual" para identificar materia anual.
    private static readonly Regex AnualHintRegex = new(
        @"\banual\b",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    public CareerPlanImportPayload Parse(string rawText)
    {
        ArgumentNullException.ThrowIfNull(rawText);

        var items = new List<ParsedSubjectItem>();
        if (string.IsNullOrWhiteSpace(rawText))
        {
            return new CareerPlanImportPayload(rawText, items, EmptySummary());
        }

        var lines = rawText.Split(
            new[] { '\r', '\n' },
            StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        int? currentYear = null;
        int? currentTerm = null;
        int index = 0;

        foreach (var line in lines)
        {
            // Update contexto de año/cuatri si la línea es un header.
            var yearFromHeader = TryParseYearHeader(line);
            if (yearFromHeader is not null)
            {
                currentYear = yearFromHeader;
            }

            var termFromHeader = TryParseTermHeader(line);
            if (termFromHeader is not null)
            {
                currentTerm = termFromHeader;
            }

            // ¿Esta línea contiene un código de materia? Si no, sigue al próximo.
            var codeMatch = CodeRegex.Match(line);
            if (!codeMatch.Success) continue;

            var code = codeMatch.Value.ToUpperInvariant().Replace("-", string.Empty);
            var item = BuildItem(index++, line, code, currentYear, currentTerm);
            items.Add(item);
        }

        return new CareerPlanImportPayload(rawText, items, ComputeSummary(items));
    }

    private static ParsedSubjectItem BuildItem(
        int index,
        string rawRow,
        string code,
        int? contextYear,
        int? contextTerm)
    {
        var issues = new List<string>();

        // Nombre: el resto de la línea después del código, limpiando ruido.
        // Heurística simple: tomar todo después del código y antes del próximo número (que suele
        // ser carga horaria).
        var afterCode = rawRow[(rawRow.IndexOf(code, StringComparison.OrdinalIgnoreCase) + code.Length)..]
            .Trim()
            .TrimStart('-', ':', '–', '|', ' ', '\t');

        var nameMatch = Regex.Match(afterCode, @"^([^\d|]{3,120})");
        var name = nameMatch.Success ? nameMatch.Value.Trim() : null;
        if (string.IsNullOrWhiteSpace(name))
        {
            issues.Add("No detectamos el nombre de la materia. Completalo manualmente.");
        }

        // Año en plan: usa el contexto del header si la línea misma no contiene un override.
        var year = contextYear;
        if (year is null)
        {
            issues.Add("No detectamos el año del plan al que pertenece. Indicá el año manualmente.");
        }

        // Término en año: idem. Override por keyword "anual" en la línea.
        var termKind = "Cuatrimestral";
        var termInYear = contextTerm;
        if (AnualHintRegex.IsMatch(rawRow))
        {
            termKind = "Anual";
            termInYear = null;
        }
        else if (termInYear is null && year is not null)
        {
            // Default conservador: si tenemos año pero no cuatri, asumimos 1c y avisamos.
            termInYear = 1;
            issues.Add("Asumimos 1er cuatrimestre por default. Verificá.");
        }

        // Confidence: cuántos campos detectados.
        var detected = 0;
        if (!string.IsNullOrWhiteSpace(name)) detected++;
        if (year is not null) detected++;
        if (termInYear is not null || termKind == "Anual") detected++;

        var confidence = detected switch
        {
            >= 3 => SubjectParseConfidence.High,
            >= 2 => SubjectParseConfidence.Medium,
            _ => SubjectParseConfidence.Low,
        };

        return new ParsedSubjectItem(
            Index: index,
            RawRow: rawRow,
            DetectedCode: code,
            DetectedName: name,
            DetectedYearInPlan: year,
            DetectedTermInYear: termInYear,
            DetectedTermKind: termKind,
            Confidence: confidence,
            Issues: issues);
    }

    private static int? TryParseYearHeader(string line)
    {
        var m = YearHeaderRegex.Match(line);
        if (!m.Success) return null;

        // Group 1 (palabra ordinal) o group 2 (número directo).
        var raw = m.Groups[1].Success ? m.Groups[1].Value : m.Groups[2].Value;
        if (int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out var n))
        {
            return n is >= 1 and <= 10 ? n : null;
        }

        return raw.ToLowerInvariant() switch
        {
            "primer" => 1,
            "segundo" => 2,
            "tercer" => 3,
            "cuarto" => 4,
            "quinto" => 5,
            "sexto" => 6,
            "septimo" => 7,
            "octavo" => 8,
            _ => null,
        };
    }

    private static int? TryParseTermHeader(string line)
    {
        var m = TermHeaderRegex.Match(line);
        if (!m.Success) return null;

        var raw = m.Groups[1].Success ? m.Groups[1].Value : m.Groups[2].Value;
        if (int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out var n))
        {
            return n is 1 or 2 ? n : null;
        }

        return raw.ToLowerInvariant() switch
        {
            "primer" => 1,
            "segundo" => 2,
            _ => null,
        };
    }

    private static CareerPlanImportSummary ComputeSummary(List<ParsedSubjectItem> items)
    {
        var high = items.Count(i => i.Confidence == SubjectParseConfidence.High);
        var medium = items.Count(i => i.Confidence == SubjectParseConfidence.Medium);
        var low = items.Count(i => i.Confidence == SubjectParseConfidence.Low);
        return new CareerPlanImportSummary(items.Count, high, medium, low);
    }

    private static CareerPlanImportSummary EmptySummary() =>
        new(0, 0, 0, 0);
}
