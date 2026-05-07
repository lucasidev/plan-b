using Planb.SharedKernel.Primitives;

namespace Planb.Identity.Domain.Users;

/// <summary>
/// Strongly-typed identity for <see cref="UserDeletionLog"/> entries. Same pattern as
/// <see cref="UserId"/>: prevents passing a raw <see cref="Guid"/> from another aggregate where
/// a <c>UserDeletionLogId</c> is expected.
/// </summary>
public readonly record struct UserDeletionLogId : IValueObject
{
    public Guid Value { get; private init; }

    public UserDeletionLogId(Guid value)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException("UserDeletionLogId cannot be empty.", nameof(value));
        }
        Value = value;
    }

    public static UserDeletionLogId New() => new(Guid.NewGuid());

    public override string ToString() => Value.ToString();
}
