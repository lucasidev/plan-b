using Planb.Identity.Application.Abstractions.Security;

namespace Planb.Identity.Infrastructure.Security;

/// <summary>
/// BCrypt-Net-Next adapter. Cost factor 12 strikes the modern balance: ~250ms per hash on a
/// commodity laptop, ample resistance against offline brute-force, manageable login latency.
/// </summary>
public sealed class BCryptPasswordHasher : IPasswordHasher
{
    private const int WorkFactor = 12;

    public string Hash(string password)
    {
        ArgumentException.ThrowIfNullOrEmpty(password);
        return BCrypt.Net.BCrypt.HashPassword(password, workFactor: WorkFactor);
    }

    public bool Verify(string password, string hash)
    {
        if (string.IsNullOrEmpty(password) || string.IsNullOrEmpty(hash))
        {
            return false;
        }
        try
        {
            return BCrypt.Net.BCrypt.Verify(password, hash);
        }
        catch (BCrypt.Net.SaltParseException)
        {
            return false;
        }
    }
}
