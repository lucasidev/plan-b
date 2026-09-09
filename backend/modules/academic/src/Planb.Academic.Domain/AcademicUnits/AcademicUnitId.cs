using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.AcademicUnits;

/// <summary>
/// Strongly-typed identifier para <see cref="AcademicUnit"/>. Mismo patrón que UniversityId / CareerId:
/// previene mezclar UUIDs entre aggregates en compile-time.
/// </summary>
public readonly record struct AcademicUnitId : IValueObject
{
    public Guid Value { get; private init; }

    public AcademicUnitId(Guid value)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException("AcademicUnitId cannot be empty.", nameof(value));
        }
        Value = value;
    }

    public static AcademicUnitId New() => new(Guid.NewGuid());

    public override string ToString() => Value.ToString();
}
