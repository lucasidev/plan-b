using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Identity.Domain.Users;
using Planb.SharedKernel.Primitives;

namespace Planb.Identity.Application.Features.Refresh;

public static class RefreshCommandHandler
{
    public static async Task<Result<RefreshResponse>> Handle(
        RefreshCommand command,
        IUserRepository users,
        IRefreshTokenStore refreshTokens,
        IJwtIssuer jwt,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(command.RefreshToken))
        {
            return UserErrors.InvalidCredentials;
        }

        var userId = await refreshTokens.ConsumeAsync(command.RefreshToken, ct);
        if (userId is null)
        {
            // Revocado, vencido, nunca emitido o ya consumido por otro pedido concurrente son
            // indistinguibles a propósito.
            return UserErrors.InvalidCredentials;
        }

        var user = await users.FindByIdAsync(userId.Value, ct);
        if (user is null)
        {
            // El token ya fue consumido de forma atómica; no queda un huérfano activo que limpiar.
            return UserErrors.InvalidCredentials;
        }

        // Block refresh from disabled / unverified users — they shouldn't keep extending sessions
        // even if they hold an old refresh token.
        // Cuenta dada de baja: se responde igual que un token inválido, a propósito. La cuenta está
        // anonimizada y no corresponde confirmar que existió.
        //
        // Este chequeo es la barrera real, no un cinturón. La revocación de refresh tokens en Redis
        // es best-effort (se traga sus propios errores con un warning) y corre DESPUÉS del
        // SaveChanges de la baja. Sin este if, un parpadeo de Redis durante la baja dejaba el
        // refresh token vivo hasta 30 días y renovable por rotación de forma indefinida: una cuenta
        // "eliminada" que sigue autenticando.
        if (user.IsDeactivated) return UserErrors.InvalidCredentials;

        if (user.IsDisabled) return UserErrors.AccountDisabled;
        if (!user.IsEmailVerified) return UserErrors.EmailNotVerified;

        // La rotación empieza con el consumo atómico de arriba: solo quien reclamó el token viejo
        // puede emitir el par nuevo.
        var fresh = jwt.IssueTokens(user);
        await refreshTokens.StoreAsync(
            fresh.RefreshToken, user.Id, fresh.RefreshTokenExpiresAt, ct);

        return new RefreshResponse(user.Id.Value, user.Email.Value, user.Role.ToString())
        {
            Tokens = fresh,
        };
    }
}
