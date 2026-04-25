using System.Buffers.Text;
using System.Security.Cryptography;
using Planb.Identity.Application.Abstractions.Security;

namespace Planb.Identity.Infrastructure.Security;

/// <summary>
/// Adapter producing URL-safe opaque tokens via <see cref="RandomNumberGenerator"/>.
/// Output is Base64Url-encoded so it embeds in URLs without further escaping.
/// </summary>
public sealed class RandomTokenGenerator : ITokenGenerator
{
    public string Generate(int byteLength = 32)
    {
        if (byteLength <= 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(byteLength), byteLength, "Token byte length must be positive.");
        }

        Span<byte> bytes = stackalloc byte[byteLength];
        RandomNumberGenerator.Fill(bytes);
        return Base64Url.EncodeToString(bytes);
    }
}
