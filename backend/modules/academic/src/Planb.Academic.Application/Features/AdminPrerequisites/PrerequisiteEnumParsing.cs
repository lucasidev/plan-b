using Planb.Academic.Domain.Prerequisites;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminPrerequisites;

/// <summary>
/// Parseo del type que viaja como string en los requests de Prerequisite (US-062, ej. "ParaCursar",
/// "ParaRendir"). Igual que <see cref="PrerequisiteType"/> es obligatorio en el aggregate (no hay
/// default): un valor vacío/null y un string no-vacío que no matchea un valor DEFINIDO del enum son
/// los dos error de validación (400). Mismo criterio que AcademicTermEnumParsing.ParseKind.
/// </summary>
internal static class PrerequisiteEnumParsing
{
    public static Result<PrerequisiteType> ParseType(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return Error.Validation(
                "academic.prerequisite.type_required", "Prerequisite type is required.");
        }

        if (Enum.TryParse<PrerequisiteType>(value, ignoreCase: true, out var parsed) && Enum.IsDefined(parsed))
        {
            return parsed;
        }

        return Error.Validation(
            "academic.prerequisite.invalid_type", $"'{value}' is not a valid type.");
    }
}
