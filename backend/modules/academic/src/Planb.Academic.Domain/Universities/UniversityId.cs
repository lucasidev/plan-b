using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.Universities;

/// <summary>
/// Strongly-typed identifier para <see cref="University"/>. Mismo pattern que UserId / TeacherId
/// del SharedKernel: previene mezclar UUIDs entre bounded contexts en compile-time.
/// </summary>
public readonly record struct UniversityId : IValueObject
{
    public Guid Value { get; private init; }

    public UniversityId(Guid value)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException("UniversityId cannot be empty.", nameof(value));
        }
        Value = value;
    }

    public static UniversityId New() => new(Guid.NewGuid());

    public override string ToString() => Value.ToString();
}
