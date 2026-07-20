using Planb.Academic.Domain;
using Planb.Academic.Domain.Subjects;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminSubjects;

/// <summary>
/// Parseo del term_kind que viaja como string en los requests de Subject (US-062). TermKind es
/// obligatorio en el aggregate (mismo criterio que AcademicTerm.Kind, a diferencia de las cadencias
/// opcionales de Career): tanto un valor vacío/null como un string no-vacío que no matchea un valor
/// DEFINIDO del enum son error de validación (400). Un typo del admin ("Trimestral") o un numérico
/// fuera de rango ("99") no se tragan en silencio.
/// </summary>
internal static class SubjectEnumParsing
{
    public static Result<TermKind> ParseTermKind(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return SubjectErrors.TermKindRequired;
        }

        if (Enum.TryParse<TermKind>(value, ignoreCase: true, out var parsed) && Enum.IsDefined(parsed))
        {
            return parsed;
        }

        return Error.Validation(
            "academic.subject.invalid_term_kind", $"'{value}' is not a valid term_kind.");
    }
}
