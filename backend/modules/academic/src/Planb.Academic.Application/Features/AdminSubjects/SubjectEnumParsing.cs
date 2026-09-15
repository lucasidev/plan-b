using Planb.Academic.Domain;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminSubjects;

/// <summary>
/// Parseo del term_kind que viaja como string en los requests de Subject (US-062). TermKind es
/// opcional en el aggregate: un valor vacío/null es simplemente "sin dato" (null). Pero un
/// string no-vacío que no matchea un valor DEFINIDO del enum sigue siendo error de validación
/// (400): un typo del admin ("Trimestral") o un numérico fuera de rango ("99") no se tragan en
/// silencio como si no hubiera mandado nada.
/// </summary>
internal static class SubjectEnumParsing
{
    public static Result<TermKind?> ParseTermKind(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return (TermKind?)null;
        }

        if (Enum.TryParse<TermKind>(value, ignoreCase: true, out var parsed) && Enum.IsDefined(parsed))
        {
            return (TermKind?)parsed;
        }

        return Error.Validation(
            "academic.subject.invalid_term_kind", $"'{value}' is not a valid term_kind.");
    }
}
