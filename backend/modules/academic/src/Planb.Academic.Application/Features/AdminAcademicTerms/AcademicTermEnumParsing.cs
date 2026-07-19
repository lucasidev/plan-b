using Planb.Academic.Domain;
using Planb.Academic.Domain.AcademicTerms;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminAcademicTerms;

/// <summary>
/// Parseo del kind que viaja como string en los requests de AcademicTerm (US-064). A diferencia de
/// <c>CareerEnumParsing</c> (donde DegreeType/Cadence son opcionales), <see cref="TermKind"/> es
/// obligatorio en el aggregate: tanto un valor vacío/null como un string no-vacío que no matchea
/// un valor DEFINIDO del enum son error de validación (400). Un typo del admin ("Trimestral") o un
/// numérico fuera de rango ("99") no se tragan en silencio.
/// </summary>
internal static class AcademicTermEnumParsing
{
    public static Result<TermKind> ParseKind(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return AcademicTermErrors.KindRequired;
        }

        if (Enum.TryParse<TermKind>(value, ignoreCase: true, out var parsed) && Enum.IsDefined(parsed))
        {
            return parsed;
        }

        return Error.Validation(
            "academic.term.invalid_kind", $"'{value}' is not a valid kind.");
    }
}
