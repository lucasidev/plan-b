using Planb.Identity.Domain.Users;

namespace Planb.Identity.Application.Abstractions.Persistence;

/// <summary>
/// Repository for the immutable audit-log entries written when a user self-deletes (UC-038).
/// Only writes; no reads exposed in MVP because no use case queries the log yet (forensic
/// lookups happen via direct DB inspection). When that changes (admin tool to investigate
/// "did this email exist before?"), add the read here.
/// </summary>
public interface IUserDeletionLogRepository
{
    /// <summary>
    /// Stages the log entry in the unit of work. Inserted on the next
    /// <see cref="IIdentityUnitOfWork.SaveChangesAsync"/>. Same transaction as the user delete
    /// (Wolverine's <c>[Transactional]</c> middleware), so either both succeed or neither does.
    /// </summary>
    void Add(UserDeletionLog log);
}
