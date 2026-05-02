using Planb.SharedKernel.Primitives;

namespace Planb.Identity.Domain.Users;

public readonly record struct StudentProfileId : IValueObject
{
    public Guid Value { get; private init; }

    public StudentProfileId(Guid value)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException("StudentProfileId cannot be empty.", nameof(value));
        }
        Value = value;
    }

    public static StudentProfileId New() => new(Guid.NewGuid());

    public override string ToString() => Value.ToString();
}
