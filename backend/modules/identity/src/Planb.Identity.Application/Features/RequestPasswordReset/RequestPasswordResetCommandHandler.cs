using Planb.Identity.Application.Abstractions.Email;
using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Identity.Domain.Users;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Abstractions.DomainEvents;
using Planb.SharedKernel.Primitives;

namespace Planb.Identity.Application.Features.RequestPasswordReset;

/// <summary>
/// Handles a forgot-password request. The contract with the endpoint is intentionally
/// boring: this handler always returns <see cref="Result.Success"/>. The endpoint maps
/// success to 204 unconditionally. There is no failure branch reachable from the outside.
///
/// Anti-enumeration is the central invariant: a stranger probing <c>/forgot-password</c>
/// with random emails must not be able to tell which addresses are registered, which are
/// verified, and which are disabled. So:
/// <list type="bullet">
///   <item>Malformed email: silent no-op.</item>
///   <item>Email not in the DB: silent no-op.</item>
///   <item>Email exists but unverified or disabled: silent no-op.</item>
///   <item>Valid + verified + active: issue a fresh password-reset token, persist, send mail.</item>
/// </list>
///
/// Rate limiting is enforced at the endpoint (per-IP), not here. The handler is purely
/// the "if this passes the policy gate, do the thing" half.
/// </summary>
public static class RequestPasswordResetCommandHandler
{
    public static async Task<Result> Handle(
        RequestPasswordResetCommand command,
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
        if (user is null || !user.IsEmailVerified || user.IsDisabled)
        {
            return Result.Success();
        }

        var rawToken = tokenGenerator.Generate();
        var tokenResult = user.RequestPasswordReset(rawToken, clock);
        if (tokenResult.IsFailure)
        {
            // The aggregate only fails on degenerate inputs (blank token, non-positive TTL),
            // both of which are infrastructure bugs. Log-and-succeed externally, surface a
            // failure internally so the test suite catches a regression in the generator.
            return tokenResult.Error;
        }

        await DomainEventDispatcher.DispatchAsync([user], publisher, ct);
        await unitOfWork.SaveChangesAsync(ct);

        await emailSender.SendPasswordResetAsync(user.Email, rawToken, ct);

        return Result.Success();
    }
}
