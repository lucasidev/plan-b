using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace Planb.Academic.Domain;

/// <summary>
/// Normaliza el nombre o slug de una Career a una única forma canónica, sin importar si el valor de
/// entrada es el nombre libre que tipeó un alumno al importar su plan (US-088) o el slug que carga
/// el admin en el backoffice (US-061). Vive en el namespace root (no en Careers/) porque cualquier
/// escritor del catálogo que necesite deduplicar por nombre lo puede reusar (mismo criterio que
/// <see cref="TermKind"/>).
///
/// <para>
/// Antes de esto, el approve del import derivaba el slug conservando acentos ("Ingeniería en
/// Sistemas" → "ingeniería-en-sistemas") mientras el alta del admin solo hacía
/// <c>Trim().ToLowerInvariant()</c> sobre el slug tipeado ("ingenieria-en-sistemas"). Dos formas
/// distintas de escribir la misma carrera nunca matcheaban, y el catálogo terminaba con una Career
/// duplicada por cada import que usaba tildes donde el admin no las había puesto.
/// </para>
/// </summary>
public static class SlugCanonicalizer
{
    private static readonly Regex WhitespaceRun = new(@"\s+", RegexOptions.Compiled);

    /// <summary>
    /// Quita acentos, pasa a minúsculas, trimea y colapsa corridas de espacios en un guión.
    /// Idempotente: canonicalizar un slug ya canónico devuelve el mismo valor.
    /// </summary>
    public static string Canonicalize(string value)
    {
        ArgumentNullException.ThrowIfNull(value);

        var lowered = value.Trim().ToLowerInvariant();
        var withoutDiacritics = RemoveDiacritics(lowered);
        return WhitespaceRun.Replace(withoutDiacritics, "-");
    }

    private static string RemoveDiacritics(string value)
    {
        var normalized = value.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(normalized.Length);
        foreach (var c in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(c);
            }
        }

        return builder.ToString().Normalize(NormalizationForm.FormC);
    }
}
