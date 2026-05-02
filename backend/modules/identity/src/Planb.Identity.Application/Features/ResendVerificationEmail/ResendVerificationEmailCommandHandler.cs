using Planb.Identity.Application.Abstractions.Email;
using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Identity.Domain.Users;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Abstractions.DomainEvents;
using Planb.SharedKernel.Primitives;

namespace Planb.Identity.Application.Features.ResendVerificationEmail;

/// <summary>
/// Handles a resend-verification-email request (US-021). Mismo contrato silencioso que el de
/// forgot-password (ADR del feature US-033): el endpoint mapea Success a 204 sin importar lo
/// que pase aca adentro.
///
/// Anti-enumeración es la invariante central: un atacante que sondee
/// <c>/api/identity/resend-verification</c> con emails al azar no debe poder distinguir cuáles
/// están registrados, cuáles ya verificados y cuáles disabled. Por eso:
/// <list type="bullet">
///   <item>Email malformado: silent no-op.</item>
///   <item>Email no existe en la DB: silent no-op.</item>
///   <item>Email existe pero ya está verificado: silent no-op (no tiene sentido reemitir token).</item>
///   <item>Email existe pero está disabled: silent no-op.</item>
///   <item>Email existe + unverified + active: emite token nuevo de 24h, persiste, manda mail.</item>
/// </list>
///
/// Rate limiting se enforce en el endpoint (per-IP), no acá. El handler es el "si pasaste el
/// gate, hacé la cosa".
/// </summary>
public static class ResendVerificationEmailCommandHandler
{
    public static async Task<Result> Handle(
        ResendVerificationEmailCommand command,
        IUserRepository users,
        IIdentityUnitOfWork unitOfWork,
        ITokenGenerator tokenGenerator,
        IVerificationEmailSender emailSender,
        IDomainEventPublisher publisher,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var emailResult = EmailAddress.Create(command.Email);
        if (emailResult.IsFailure)
        {
            return Result.Success();
        }

        var user = await users.FindByEmailAsync(emailResult.Value, ct);
        if (user is null || user.IsEmailVerified || user.IsDisabled)
        {
            return Result.Success();
        }

        var rawToken = tokenGenerator.Generate();
        var tokenResult = user.RequestVerificationResend(rawToken, clock);
        if (tokenResult.IsFailure)
        {
            // El aggregate sólo falla con inputs degenerados (token blank, TTL no positivo) —
            // ambos son bugs de infrastructure. Propagamos para que la suite de tests cazara
            // una regresión en el generator.
            return tokenResult.Error;
        }

        await DomainEventDispatcher.DispatchAsync([user], publisher, ct);
        await unitOfWork.SaveChangesAsync(ct);

        await emailSender.SendAsync(user.Email, rawToken, ct);

        return Result.Success();
    }
}
