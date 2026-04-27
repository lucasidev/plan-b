using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Identity.Domain.Users;
using Planb.SharedKernel.Abstractions.Clock;

namespace Planb.Identity.Infrastructure.Security;

/// <summary>
/// HS256 JWT issuer. Per ADR-0023 the access token carries `sub`, `email`, `role`, `iat`, `exp`
/// and is signed with the symmetric secret in <c>JWT__Secret</c>. The refresh token is 32
/// random bytes URL-base64 encoded — opaque to the client.
/// </summary>
public sealed class JwtIssuer : IJwtIssuer
{
    private readonly JwtOptions _options;
    private readonly IDateTimeProvider _clock;
    private readonly SigningCredentials _signingCredentials;
    private readonly JwtSecurityTokenHandler _handler = new();

    public JwtIssuer(IOptions<JwtOptions> options, IDateTimeProvider clock)
    {
        _options = options.Value;
        _clock = clock;
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.Secret));
        _signingCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
    }

    public AuthTokens IssueTokens(User user)
    {
        var now = _clock.UtcNow;
        var accessExpires = now.AddMinutes(_options.AccessTokenMinutes);
        var refreshExpires = now.AddDays(_options.RefreshTokenDays);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.Value.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email.Value),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim(JwtRegisteredClaimNames.Iat, now.ToUnixTimeSeconds().ToString(),
                ClaimValueTypes.Integer64),
        };

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            notBefore: now.UtcDateTime,
            expires: accessExpires.UtcDateTime,
            signingCredentials: _signingCredentials);

        var accessToken = _handler.WriteToken(token);
        var refreshToken = GenerateRefreshToken();

        return new AuthTokens(
            AccessToken: accessToken,
            AccessTokenExpiresAt: accessExpires,
            RefreshToken: refreshToken,
            RefreshTokenExpiresAt: refreshExpires);
    }

    /// <summary>
    /// 32 cryptographically-random bytes, URL-safe base64. ~256 bits of entropy — collision-
    /// resistant for any realistic user count and unguessable.
    /// </summary>
    private static string GenerateRefreshToken()
    {
        var buf = new byte[32];
        RandomNumberGenerator.Fill(buf);
        return Base64UrlEncoder.Encode(buf);
    }
}
