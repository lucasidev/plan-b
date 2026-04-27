using Planb.Identity.Domain.Users;

namespace Planb.Identity.Application.Abstractions.Security;

/// <summary>
/// Port for issuing JWT access tokens and matching opaque refresh tokens. Per ADR-0023 the
/// access token carries minimal claims (sub, email, role, iat, exp) and is signed HS256 with
/// the secret in <c>JWT__Secret</c>. The refresh token is a 32-byte random URL-safe string
/// — opaque to the client, hashed before storage in the revocation list (ADR-0034 patrón #1).
/// </summary>
public interface IJwtIssuer
{
    /// <summary>
    /// Issues a fresh access + refresh pair for an authenticated user.
    /// Caller is responsible for persisting the refresh token's hash in the revocation
    /// list so future refresh / sign-out can act on it.
    /// </summary>
    AuthTokens IssueTokens(User user);
}

/// <param name="AccessToken">Signed JWT, base64url-encoded.</param>
/// <param name="AccessTokenExpiresAt">Absolute UTC instant the access token expires.</param>
/// <param name="RefreshToken">Opaque refresh token, base64url-encoded random bytes.</param>
/// <param name="RefreshTokenExpiresAt">Absolute UTC instant the refresh token expires.</param>
public sealed record AuthTokens(
    string AccessToken,
    DateTimeOffset AccessTokenExpiresAt,
    string RefreshToken,
    DateTimeOffset RefreshTokenExpiresAt);
