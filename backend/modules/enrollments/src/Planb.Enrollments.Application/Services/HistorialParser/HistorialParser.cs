using System.Globalization;
using System.Text.RegularExpressions;
using Planb.Academic.Application.Contracts;
using Planb.Enrollments.Domain.HistorialImports;

namespace Planb.Enrollments.Application.Services.HistorialParser;

/// <summary>
/// Parser heurístico de historiales académicos (US-014). Trabaja sobre texto crudo extraído
/// del PDF (o pegado por el user) y aplica regex flexibles para detectar:
///
/// <list type="bullet">
///   <item><b>Código de materia</b>: ancla principal. Letras + dígitos opcionales con guión.
///         Validado contra <c>SubjectsByCode</c> del plan del student.</item>
///   <item><b>Nota / grade</b>: 0–10 con coma o punto decimal.</item>
///   <item><b>Estado</b>: keywords (Aprobada, Regular, Cursando, etc.).</item>
///   <item><b>Período</b>: múltiples formatos (2024·1c, 1er cuatri 2024, etc).</item>
///   <item><b>Método de aprobación</b>: keywords (Cursada, Final, Equivalencia, etc.).</item>
/// </list>
///
/// <para>
/// Estrategia: tokeniza el texto en filas lógicas (líneas), para cada una intenta hallar
/// el código (ancla). Si encontró código y matchea el plan, busca el resto de fields en la
/// misma fila o adyacentes. Computa una confianza (high/medium/low) según cuántos fields
/// detectó.
/// </para>
///
/// <para>
/// El parser NO falla nunca por inputs raros: lo peor que devuelve es un payload con
/// <see cref="HistorialImportPayload.Items"/> vacío o con todos en Low confidence. El user
/// igual ve algo en el preview y puede completar manual.
/// </para>
/// </summary>
public sealed class HistorialParser : IHistorialParser
{
    // Código de materia: 2-5 letras MAYÚSCULAS + opcional guión + 2-4 dígitos.
    // Ej: MAT201, ALG-101, ISW301, BD401, REDES301
    private static readonly Regex CodeRegex = new(
        @"\b([A-Z]{2,5})-?(\d{2,4})\b",
        RegexOptions.Compiled);

    // Nota: 0-10 con punto o coma decimal, hasta 2 decimales.
    // Importante: el regex prioriza el match más largo (10[.,]00 antes que solo 1).
    private static readonly Regex GradeRegex = new(
        @"\b(10(?:[.,]00?)?|[0-9](?:[.,]\d{1,2})?)\b",
        RegexOptions.Compiled);

    // Status keywords. Case-insensitive.
    private static readonly Regex StatusAprobadaRegex = new(
        @"\b(aprob(?:ada|ado|\.)?|approved|AP|A\b)\b",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex StatusRegularRegex = new(
        @"\bregular(?:izada|izado)?\b",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex StatusCursandoRegex = new(
        @"\b(cursando|en curso)\b",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex StatusReprobadaRegex = new(
        @"\b(reprob(?:ada|ado)?|desaprob(?:ada|ado)?|insuf(?:iciente)?)\b",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex StatusAbandonadaRegex = new(
        @"\b(abandon(?:ada|ado|o)?)\b",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex StatusEquivalenciaRegex = new(
        @"\b(equiv(?:alencia)?)\b",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    // Approval method keywords.
    private static readonly Regex MethodPromocionRegex = new(
        @"\b(promoci[oó]n|promo)\b",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex MethodFinalLibreRegex = new(
        @"\b(final\s*libre|f\.?\s*l\.?)\b",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex MethodCursadaRegex = new(
        @"\b(cursada|cursado)\b",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex MethodFinalRegex = new(
        @"\bfinal\b",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    // Período: múltiples patrones evaluados en orden.
    // 1. "2024·1c" / "2024-1c" / "2024 1c" / "2024 / 1c"
    // 2. "1c/2024" / "1c-2024" / "1c 2024"
    // 3. "1er cuatri 2024" / "primer cuatrimestre 2024" / "segundo cuatri 2024"
    // 4. "Cuatri 1/2024" / "Cuatri 1 2024" / "C1 2024"
    private static readonly Regex PeriodYearFirstRegex = new(
        @"\b(20\d{2})\s*[\-·/\s]?\s*([12])\s*[Cc°ºo]\b",
        RegexOptions.Compiled);
    private static readonly Regex PeriodCuatriFirstRegex = new(
        @"\b([12])\s*[Cc°ºo]\s*[\-/\s]\s*(20\d{2})\b",
        RegexOptions.Compiled);
    private static readonly Regex PeriodOrdinalRegex = new(
        @"\b(1\s*er|2\s*do|primer|segundo)\s+cuatr\w*\s+(20\d{2})\b",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex PeriodCuatriLabelRegex = new(
        @"\bcuatri(?:mestre)?\s*([12])\s*[/\-\s]\s*(20\d{2})\b",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    public HistorialImportPayload Parse(string rawText, HistorialParserInputs inputs)
    {
        ArgumentNullException.ThrowIfNull(rawText);
        ArgumentNullException.ThrowIfNull(inputs);

        var items = new List<ParsedItem>();
        if (string.IsNullOrWhiteSpace(rawText))
        {
            return new HistorialImportPayload(rawText, items, EmptySummary());
        }

        // Dividimos el texto en líneas lógicas. Aceptamos cualquier separador whitespace +
        // newline. El SIU típicamente usa newlines como separadores de filas; cuando una
        // fila se rompe en 2 líneas (largo), el parser intenta cada una por separado.
        var lines = rawText.Split(
            new[] { '\r', '\n' },
            StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        var index = 0;
        foreach (var line in lines)
        {
            var matches = CodeRegex.Matches(line);
            if (matches.Count == 0) continue;

            foreach (Match m in matches)
            {
                var code = m.Value.ToUpperInvariant().Replace("-", string.Empty);
                // Solo procesamos códigos que existen en el plan del student. Si no matchea,
                // skip (no inventamos materias).
                if (!inputs.SubjectsByCode.TryGetValue(code, out var subject)) continue;

                var item = BuildItem(index++, line, code, subject, inputs);
                items.Add(item);
            }
        }

        var summary = ComputeSummary(items);
        return new HistorialImportPayload(rawText, items, summary);
    }

    private static ParsedItem BuildItem(
        int index,
        string rawRow,
        string code,
        SubjectListItem subject,
        HistorialParserInputs inputs)
    {
        var issues = new List<string>();

        // ── Nota ──────────────────────────────────────────────────────────
        decimal? grade = null;
        var gradeMatches = GradeRegex.Matches(rawRow);
        foreach (Match m in gradeMatches)
        {
            var token = m.Value.Replace(",", ".");
            if (decimal.TryParse(token, NumberStyles.Number, CultureInfo.InvariantCulture, out var g))
            {
                // Filtrar: si es 0..10 y el match NO está adyacente al código (mismo número),
                // tomarlo como nota. El año (>= 2000) lo descarta el rango.
                if (g >= 0 && g <= 10)
                {
                    grade = g;
                    break; // primer match válido
                }
            }
        }

        // ── Status ────────────────────────────────────────────────────────
        string? status = null;
        if (StatusAprobadaRegex.IsMatch(rawRow)) status = "Aprobada";
        else if (StatusRegularRegex.IsMatch(rawRow)) status = "Regular";
        else if (StatusCursandoRegex.IsMatch(rawRow)) status = "Cursando";
        else if (StatusReprobadaRegex.IsMatch(rawRow)) status = "Reprobada";
        else if (StatusAbandonadaRegex.IsMatch(rawRow)) status = "Abandonada";

        var isEquivalencia = StatusEquivalenciaRegex.IsMatch(rawRow);
        if (isEquivalencia)
        {
            // Equivalencia: status=Aprobada + approvalMethod=Equivalencia. La keyword
            // "equivalencia" pisa lo que haya detectado antes.
            status = "Aprobada";
        }

        // Si tenemos nota válida y no detectamos status explícito → asumir Aprobada y avisar.
        if (status is null && grade is not null)
        {
            status = "Aprobada";
            issues.Add("Estado inferido como Aprobada por la nota detectada.");
        }

        // ── ApprovalMethod ────────────────────────────────────────────────
        string? approvalMethod = null;
        if (isEquivalencia)
        {
            approvalMethod = "Equivalencia";
        }
        else if (MethodFinalLibreRegex.IsMatch(rawRow))
        {
            approvalMethod = "FinalLibre";
        }
        else if (MethodPromocionRegex.IsMatch(rawRow))
        {
            approvalMethod = "Promocion";
        }
        else if (MethodCursadaRegex.IsMatch(rawRow))
        {
            approvalMethod = "Cursada";
        }
        else if (MethodFinalRegex.IsMatch(rawRow))
        {
            approvalMethod = "Final";
        }

        // ── Período ───────────────────────────────────────────────────────
        var (year, termNumber) = TryDetectPeriod(rawRow);
        Guid? termId = null;
        string? termLabel = null;
        if (year is not null && termNumber is not null)
        {
            var matchedTerm = inputs.Terms.FirstOrDefault(
                t => t.Year == year.Value && t.Number == termNumber.Value);
            if (matchedTerm is not null)
            {
                termId = matchedTerm.Id;
                termLabel = matchedTerm.Label;
            }
            else
            {
                issues.Add($"Período {year}·{termNumber}c detectado pero no está cargado en tu universidad.");
            }
        }
        else if (status != "Cursando" && approvalMethod != "Equivalencia")
        {
            issues.Add("No detectamos el cuatrimestre. Completalo manualmente.");
        }

        // ── Confianza ─────────────────────────────────────────────────────
        var fieldsDetected = 0;
        if (grade is not null) fieldsDetected++;
        if (status is not null) fieldsDetected++;
        if (approvalMethod is not null) fieldsDetected++;
        if (year is not null && termNumber is not null) fieldsDetected++;

        var confidence = fieldsDetected switch
        {
            >= 4 => ParseConfidence.High,
            >= 2 => ParseConfidence.Medium,
            _ => ParseConfidence.Low,
        };

        return new ParsedItem(
            Index: index,
            RawRow: rawRow,
            DetectedCode: code,
            DetectedGrade: grade,
            DetectedStatus: status,
            DetectedApprovalMethod: approvalMethod,
            DetectedYear: year,
            DetectedTermNumber: termNumber,
            SubjectId: subject.Id,
            SubjectName: subject.Name,
            TermId: termId,
            TermLabel: termLabel,
            Confidence: confidence,
            Issues: issues);
    }

    private static (int? year, int? termNumber) TryDetectPeriod(string line)
    {
        var m1 = PeriodYearFirstRegex.Match(line);
        if (m1.Success)
        {
            return (int.Parse(m1.Groups[1].Value, CultureInfo.InvariantCulture),
                    int.Parse(m1.Groups[2].Value, CultureInfo.InvariantCulture));
        }

        var m2 = PeriodCuatriFirstRegex.Match(line);
        if (m2.Success)
        {
            return (int.Parse(m2.Groups[2].Value, CultureInfo.InvariantCulture),
                    int.Parse(m2.Groups[1].Value, CultureInfo.InvariantCulture));
        }

        var m3 = PeriodOrdinalRegex.Match(line);
        if (m3.Success)
        {
            var ord = m3.Groups[1].Value.ToLowerInvariant();
            var termNum = ord.StartsWith("1") || ord.StartsWith("primer") ? 1 : 2;
            return (int.Parse(m3.Groups[2].Value, CultureInfo.InvariantCulture), termNum);
        }

        var m4 = PeriodCuatriLabelRegex.Match(line);
        if (m4.Success)
        {
            return (int.Parse(m4.Groups[2].Value, CultureInfo.InvariantCulture),
                    int.Parse(m4.Groups[1].Value, CultureInfo.InvariantCulture));
        }

        return (null, null);
    }

    private static HistorialImportSummary ComputeSummary(IReadOnlyList<ParsedItem> items)
    {
        var high = items.Count(i => i.Confidence == ParseConfidence.High);
        var medium = items.Count(i => i.Confidence == ParseConfidence.Medium);
        var low = items.Count(i => i.Confidence == ParseConfidence.Low);
        return new HistorialImportSummary(
            TotalDetected: items.Count,
            HighConfidence: high,
            MediumConfidence: medium,
            LowConfidence: low);
    }

    private static HistorialImportSummary EmptySummary() => new(0, 0, 0, 0);
}
