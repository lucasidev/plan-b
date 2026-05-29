using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Domain.Reviews;

/// <summary>
/// Strongly-typed identity para <see cref="Review"/>. Evita que un Guid suelto de otro
/// agregado (TeacherId, EnrollmentRecordId) se cuele donde esperamos un ReviewId.
/// </summary>
public readonly record struct ReviewId : IValueObject
{
    public Guid Value { get; private init; }

    public ReviewId(Guid value)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException("ReviewId cannot be empty.", nameof(value));
        }
        Value = value;
    }

    public static ReviewId New() => new(Guid.NewGuid());

    public override string ToString() => Value.ToString();
}
