using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.Careers;

public readonly record struct CareerId : IValueObject
{
    public Guid Value { get; private init; }

    public CareerId(Guid value)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException("CareerId cannot be empty.", nameof(value));
        }
        Value = value;
    }

    public static CareerId New() => new(Guid.NewGuid());

    public override string ToString() => Value.ToString();
}
