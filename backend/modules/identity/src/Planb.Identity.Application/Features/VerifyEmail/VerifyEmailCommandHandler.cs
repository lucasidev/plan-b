using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Domain.Users;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Abstractions.DomainEvents;
using Planb.SharedKernel.Primitives;

namespace Planb.Identity.Application.Features.VerifyEmail;

public static class VerifyEmailCommandHandler
{
    public static async Task<Result<VerifyEmailResponse>> Handle(
        VerifyEmailCommand command,
        IUserRepository users,
        IIdentityUnitOfWork unitOfWork,
        IDomainEventPublisher publisher,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var user = await users.FindByVerificationTokenAsync(
            command.Token, TokenPurpose.UserEmailVerification, ct);

        if (user is null)
        {
            return UserErrors.VerificationTokenInvalid;
        }

        var verifyResult = user.VerifyEmail(command.Token, clock);
        if (verifyResult.IsFailure)
        {
            return verifyResult.Error;
        }

        await DomainEventDispatcher.DispatchAsync([user], publisher, ct);

        await unitOfWork.SaveChangesAsync(ct);

        return new VerifyEmailResponse(user.Id.Value, user.EmailVerifiedAt!.Value);
    }
}
