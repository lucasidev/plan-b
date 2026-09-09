using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.OfficialFacts;

/// <summary>Strongly-typed identifier para <see cref="OfficialFact"/>.</summary>
public readonly record struct OfficialFactId : IValueObject
{
    public Guid Value { get; private init; }

    public OfficialFactId(Guid value)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException("OfficialFactId cannot be empty.", nameof(value));
        }
        Value = value;
    }

    public static OfficialFactId New() => new(Guid.NewGuid());

    public override string ToString() => Value.ToString();
}
