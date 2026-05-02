using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Identity.Domain.Users;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Abstractions.DomainEvents;
using Planb.SharedKernel.Primitives;

namespace Planb.Identity.Application.Features.SignIn;

public static class SignInCommandHandler
{
    public static async Task<Result<SignInResponse>> Handle(
        SignInCommand command,
        IUserRepository users,
        IPasswordHasher passwords,
        IJwtIssuer jwt,
        IRefreshTokenStore refreshTokens,
        IDomainEventPublisher publisher,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var emailResult = EmailAddress.Create(command.Email);
        if (emailResult.IsFailure)
        {
            // Treat malformed emails as bad creds, not validation errors. Anti-enumeration:
            // attackers shouldn't learn that "this email is malformed but exists" is different
            // from "this email is well-formed but unknown".
            return UserErrors.InvalidCredentials;
        }

        var user = await users.FindByEmailAsync(emailResult.Value, ct);
        if (user is null || user.IsExpired)
        {
            // El repo ya filtra por expired_at IS NULL, por lo que esta rama del IsExpired
            // debería ser inalcanzable. La dejamos defensiva: si en el futuro alguien refactorea
            // el repo y olvida el filter, el sign-in no debería empezar a funcionar para users
            // expired (sería un leak de info silencioso). Anti-enum: misma respuesta que un
            // user no encontrado.
            return UserErrors.InvalidCredentials;
        }

        var authResult = user.Authenticate(
            hash => passwords.Verify(command.Password, hash),
            clock);
        if (authResult.IsFailure)
        {
            return authResult.Error;
        }

        var tokens = jwt.IssueTokens(user);
        await refreshTokens.StoreAsync(
            tokens.RefreshToken, user.Id, tokens.RefreshTokenExpiresAt, ct);

        await DomainEventDispatcher.DispatchAsync([user], publisher, ct);

        return new SignInResponse(user.Id.Value, user.Email.Value, user.Role.ToString())
        {
            Tokens = tokens,
        };
    }
}
