namespace Planb.Identity.Application.Abstractions.Security;

/// <summary>
/// Port for cryptographically-strong opaque tokens (URL-safe). Used for email verification,
/// password reset, etc. Implementations must use a CSPRNG.
/// </summary>
public interface ITokenGenerator
{
    /// <summary>
    /// Generates a URL-safe random token of <paramref name="byteLength"/> bytes (default 32 = 256 bits).
    /// The returned string length depends on the encoding (Base64Url ~= 1.33x byteLength).
    /// </summary>
    string Generate(int byteLength = 32);
}
