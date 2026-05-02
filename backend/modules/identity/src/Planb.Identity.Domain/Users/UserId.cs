using Planb.SharedKernel.Primitives;

namespace Planb.Identity.Domain.Users;

/// <summary>
/// Strongly-typed identity for <see cref="User"/>. Prevents passing a raw <see cref="Guid"/> from
/// another aggregate (e.g. a TeacherId) where a UserId is expected — that becomes a compile-time
/// error instead of a silent bug.
/// </summary>
public readonly record struct UserId : IValueObject
{
    public Guid Value { get; private init; }

    public UserId(Guid value)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException("UserId cannot be empty.", nameof(value));
        }
        Value = value;
    }

    public static UserId New() => new(Guid.NewGuid());

    public override string ToString() => Value.ToString();
}
