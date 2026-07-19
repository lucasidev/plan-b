using Planb.Academic.Domain;
using Planb.Academic.Domain.Careers;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminCareers;

/// <summary>
/// Parseo de los enums opcionales que viajan como string en los requests de Career (US-061).
/// Compartido por Create y Update para no duplicar el bloque (#5). Un campo vacío/null es válido
/// (queda null: el enum es opcional); un string no-vacío que no matchea un valor DEFINIDO del enum
/// es un error de validación (400), no un null silencioso: un typo del admin ("Grrado") o un
/// numérico fuera de rango ("999") no se tragan en silencio.
/// </summary>
internal static class CareerEnumParsing
{
    public static Result<CareerDegreeType?> ParseDegreeType(string? value) =>
        Parse<CareerDegreeType>(value, "degree_type");

    public static Result<TermKind?> ParseCadence(string? value) =>
        Parse<TermKind>(value, "cadence");

    private static Result<T?> Parse<T>(string? value, string fieldName)
        where T : struct, Enum
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return (T?)null;
        }

        if (Enum.TryParse<T>(value, ignoreCase: true, out var parsed) && Enum.IsDefined(parsed))
        {
            return (T?)parsed;
        }

        return Error.Validation(
            $"academic.career.invalid_{fieldName}", $"'{value}' is not a valid {fieldName}.");
    }
}
