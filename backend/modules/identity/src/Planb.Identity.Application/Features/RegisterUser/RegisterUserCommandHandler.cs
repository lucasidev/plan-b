using Planb.Identity.Application.Abstractions.Email;
using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Identity.Domain.EmailVerifications;
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
        IEmailVerificationTokenRepository tokens,
        IIdentityUnitOfWork unitOfWork,
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

        if (await users.ExistsByEmailAsync(email, ct))
        {
            return UserErrors.EmailAlreadyInUse;
        }

        var passwordHash = passwords.Hash(command.Password);
        var userResult = User.Register(email, passwordHash, clock);
        if (userResult.IsFailure)
        {
            return userResult.Error;
        }
        var user = userResult.Value;
        users.Add(user);

        var rawToken = tokenGenerator.Generate();
        var tokenResult = EmailVerificationToken.Issue(
            user.Id, rawToken, VerificationTokenTtl, clock);
        if (tokenResult.IsFailure)
        {
            return tokenResult.Error;
        }
        tokens.Add(tokenResult.Value);

        await DomainEventDispatcher.DispatchAsync(
            [user, tokenResult.Value], publisher, ct);

        await unitOfWork.SaveChangesAsync(ct);

        await emailSender.SendAsync(user.Email, rawToken, ct);

        return new RegisterUserResponse(user.Id.Value, user.Email.Value);
    }
}
