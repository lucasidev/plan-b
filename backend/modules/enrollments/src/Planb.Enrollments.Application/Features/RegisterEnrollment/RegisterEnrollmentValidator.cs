using FluentValidation;

namespace Planb.Enrollments.Application.Features.RegisterEnrollment;

internal sealed class RegisterEnrollmentValidator : AbstractValidator<RegisterEnrollmentCommand>
{
    public RegisterEnrollmentValidator()
    {
        RuleFor(c => c.UserId).NotEmpty();
        RuleFor(c => c.SubjectId).NotEmpty();
        // Status/ApprovalMethod son enums fuertes en el command; el endpoint los parsea desde
        // string antes de enviar, y devuelve 400 si el string es inválido.
        // Grade tiene rango validado en el VO + invariantes del aggregate. Acá solo chequeamos
        // que si viene grade, no esté fuera de los bounds básicos para fallar fast.
        RuleFor(c => c.Grade!.Value)
            .InclusiveBetween(0m, 10m)
            .When(c => c.Grade is not null);
    }
}
