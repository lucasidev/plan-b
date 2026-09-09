using Planb.Academic.Domain.OfficialFacts;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.OfficialFacts;

/// <summary>
/// Parseo de los enums de OfficialFact que viajan como string (query param o body). Mismo criterio
/// que <c>CareerEnumParsing</c>: un string no-vacío que no matchea un valor definido del enum es un
/// error de validación (400), nunca un null silencioso ni un numérico ("9") colado por
/// <see cref="Enum.TryParse{TEnum}(string, bool, out TEnum)"/> (#428).
/// </summary>
internal static class OfficialFactEnumParsing
{
    public static Result<OfficialFactSubjectType> ParseSubjectType(string? value) =>
        ParseRequired<OfficialFactSubjectType>(value, "subject_type");

    public static Result<OfficialFactStatus> ParseStatus(string? value) =>
        ParseRequired<OfficialFactStatus>(value, "status");

    private static Result<T> ParseRequired<T>(string? value, string fieldName)
        where T : struct, Enum
    {
        if (StrictEnum.TryParse<T>(value, out var parsed))
        {
            return parsed;
        }

        return Error.Validation(
            $"academic.official_fact.invalid_{fieldName}", $"'{value}' is not a valid {fieldName}.");
    }
}
