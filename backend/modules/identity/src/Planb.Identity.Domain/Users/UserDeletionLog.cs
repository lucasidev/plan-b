using System.Security.Cryptography;
using System.Text;
using Planb.SharedKernel.Primitives;

namespace Planb.Identity.Domain.Users;

/// <summary>
/// Immutable audit log row written when a user self-deletes their account (UC-038, Ley 25.326
/// art. 6). Lives independently of the <see cref="User"/> aggregate (the user row is gone
/// after the delete) so that two questions remain answerable:
/// <list type="bullet">
///   <item>"Did this user ever exist on plan-b?" — yes, the row is in this log.</item>
///   <item>"Did the same email come back later?" — comparing the SHA-256 hash of the new email
///     to <see cref="EmailHash"/> answers it without retaining the original email.</item>
/// </list>
/// We hash the email instead of storing it plain because the act of deletion is supposed to
/// remove the user's identifiable data; keeping a hash respects that intent (you cannot recover
/// the email from the hash) while preserving forensic continuity.
/// </summary>
public sealed class UserDeletionLog : Entity<UserDeletionLogId>, IAggregateRoot
{
    public UserId UserId { get; private set; }
    public string EmailHash { get; private set; } = null!;
    public DateTimeOffset DeletedAt { get; private set; }

    private UserDeletionLog() { }

    /// <summary>
    /// Creates a deletion log entry. The caller is expected to pass the user's email plain text
    /// — this method handles hashing internally so callers cannot accidentally persist the raw
    /// value. Use <see cref="HashEmail"/> directly only when correlating an existing log entry
    /// with a candidate email (e.g. forensic lookup).
    /// </summary>
    public static UserDeletionLog Create(UserId userId, EmailAddress email, DateTimeOffset deletedAt) =>
        new()
        {
            Id = UserDeletionLogId.New(),
            UserId = userId,
            EmailHash = HashEmail(email),
            DeletedAt = deletedAt,
        };

    /// <summary>
    /// SHA-256 of the email's lowercase value, hex-encoded. Lowercase first so two casings of
    /// the same address (RFC 5321 says local-part is case-sensitive but virtually no provider
    /// honors that) hash to the same value. Hex (not base64) so the column is greppable when a
    /// human inspects the table.
    /// </summary>
    public static string HashEmail(EmailAddress email)
    {
        // EmailAddress is a value-typed VO; can't be null. We re-normalize defensively in case
        // a future change to EmailAddress.Create lets a non-canonical Value through.
        var normalized = email.Value.Trim().ToLowerInvariant();
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(normalized));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
