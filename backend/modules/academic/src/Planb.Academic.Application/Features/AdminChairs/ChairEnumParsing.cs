using Planb.Academic.Domain.Chairs;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminChairs;

/// <summary>
/// Parseo del rol que viaja como string en los requests de cátedra (US-196). Mismo criterio que
/// <c>CommissionEnumParsing</c>: el enum no se bindea directo desde JSON, así que un typo del admin
/// tiene que salir como 400 con su mensaje y no como el 500 que produce un fallo de binding.
/// </summary>
internal static class ChairEnumParsing
{
    public static Result<ChairMemberRole> ParseMemberRole(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return Error.Validation(
                "academic.chair.member_role_required", "Chair member role is required.");
        }

        if (StrictEnum.TryParse<ChairMemberRole>(value, out var parsed))
        {
            return parsed;
        }

        return Error.Validation(
            "academic.chair.invalid_member_role", $"'{value}' is not a valid chair member role.");
    }
}
