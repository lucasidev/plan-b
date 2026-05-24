using FluentValidation;
using Planb.Identity.Domain.Users;

namespace Planb.Identity.Application.Features.UpdateMyProfile;

/// <summary>
/// Validator estructural del command. Las reglas de dominio (rango de yearOfStudy, longitud
/// de displayName) se delegan al aggregate <see cref="User.UpdateActiveStudentProfile"/>
/// para tener un solo source of truth, pero acá chequeamos lo barato: UserId no vacío y al
/// menos un campo no-null (PATCH vacío no tiene sentido).
/// </summary>
internal sealed class UpdateMyProfileValidator : AbstractValidator<UpdateMyProfileCommand>
{
    public UpdateMyProfileValidator()
    {
        RuleFor(c => c.UserId.Value).NotEmpty();

        RuleFor(c => c).Must(HasAtLeastOneField)
            .WithMessage("PATCH must include at least one field to update.")
            .WithName("body");
    }

    private static bool HasAtLeastOneField(UpdateMyProfileCommand c) =>
        c.DisplayName is not null
        || c.YearOfStudy.HasValue
        || c.Legajo is not null
        || c.RegularStudent.HasValue;
}
