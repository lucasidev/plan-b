using Planb.Academic.Application.Contracts;
using Planb.Identity.Application.Abstractions.Email;
using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Identity.Domain.Users;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Abstractions.DomainEvents;
using Planb.SharedKernel.Primitives;

namespace Planb.Identity.Application.Features.RegisterUser;

public static class RegisterUserCommandHandler
{
    /// <summary>
    /// 24h is the standard verification-link TTL — long enough for the email to land in spam and
    /// be recovered the next morning, short enough to limit replay risk.
    /// </summary>
    private static readonly TimeSpan VerificationTokenTtl = TimeSpan.FromHours(24);

    public static async Task<Result<RegisterUserResponse>> Handle(
        RegisterUserCommand command,
        IUserRepository users,
        IIdentityUnitOfWork unitOfWork,
        IAcademicQueryService academic,
        IPasswordHasher passwords,
        ITokenGenerator tokenGenerator,
        IVerificationEmailSender emailSender,
        IDomainEventPublisher publisher,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var emailResult = EmailAddress.Create(command.Email);
        if (emailResult.IsFailure)
        {
            return emailResult.Error;
        }
        var email = emailResult.Value;

        // El plan se resuelve ANTES del hash y del exists. No es un detalle de orden: es una
        // defensa de seguridad de la misma clase que la que ADR-0076 ya cerró. Si el plan se
        // validara después del exists, un plan inválido daría 400 con un mail libre pero 202 con
        // un mail ocupado (esa rama corta antes de llegar a mirar el plan): mandando un plan
        // inventado, el status code delataría si esa casilla tiene cuenta. Validar acá hace que un
        // plan inválido responda siempre 400, sin importar el estado del mail.
        var plan = await academic.GetCareerPlanByIdAsync(command.CareerPlanId, ct);
        if (plan is null)
        {
            return UserErrors.RegistrationCareerPlanNotFound;
        }

        // El hash se computa antes de mirar si el mail existe: BCrypt domina el tiempo de la
        // request, y calcularlo solo para mails libres dejaria medir la diferencia por timing.
        var passwordHash = passwords.Hash(command.Password);

        if (await users.ExistsByEmailAsync(email, ct))
        {
            // ADR-0076: la respuesta no distingue. El dueno de la casilla recibe el aviso de
            // que alguien intento registrarse, con sus salidas (ingresar, recuperar); aca no
            // se crea nada y no se pisa nada.
            await emailSender.SendExistingAccountNoticeAsync(email, ct);
            return new RegisterUserResponse(email.Value);
        }

        var userResult = User.Register(email, passwordHash, clock);
        if (userResult.IsFailure)
        {
            return userResult.Error;
        }
        var user = userResult.Value;

        var declareResult = user.DeclareCareerAtRegistration(plan.Id, plan.CareerId, clock);
        if (declareResult.IsFailure)
        {
            return declareResult.Error;
        }

        var rawToken = tokenGenerator.Generate();
        var tokenResult = user.IssueVerificationToken(
            TokenPurpose.UserEmailVerification, rawToken, VerificationTokenTtl, clock);
        if (tokenResult.IsFailure)
        {
            return tokenResult.Error;
        }

        users.Add(user);

        await DomainEventDispatcher.DispatchAsync([user], publisher, ct);

        await unitOfWork.SaveChangesAsync(ct);

        await emailSender.SendAsync(user.Email, rawToken, ct);

        return new RegisterUserResponse(user.Email.Value);
    }
}
