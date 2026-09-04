using FluentValidation;

namespace Planb.Identity.Application.Features.RegisterUser;

internal sealed class RegisterUserValidator : AbstractValidator<RegisterUserCommand>
{
    /// <summary>
    /// NIST 800-63B aligned: prefer length over complexity rules. 12 chars is the modern floor.
    /// </summary>
    public const int MinPasswordLength = 12;
    public const int MaxPasswordLength = 256;
    public const int MaxEmailLength = 254;

    public RegisterUserValidator()
    {
        // El formato se chequea acá y no solo en el dominio: el endpoint gasta cupo del rate
        // limiter por casilla antes de invocar el handler, y un mail sin arroba no tiene que
        // consumirlo (agotado el cupo, la respuesta es el 202 de ADR-0076, no el 400).
        RuleFor(c => c.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(MaxEmailLength);

        RuleFor(c => c.Password)
            .NotEmpty()
            .MinimumLength(MinPasswordLength)
            .MaximumLength(MaxPasswordLength);

        RuleFor(c => c.CareerPlanId)
            .NotEmpty();
    }
}
