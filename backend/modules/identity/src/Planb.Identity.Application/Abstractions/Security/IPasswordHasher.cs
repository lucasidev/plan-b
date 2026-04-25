namespace Planb.Identity.Application.Abstractions.Security;

/// <summary>
/// Port for password hashing. The implementation choice (BCrypt, Argon2, etc.) lives in the
/// infrastructure layer. The handler treats hashes as opaque strings.
/// </summary>
public interface IPasswordHasher
{
    string Hash(string password);

    bool Verify(string password, string hash);
}
