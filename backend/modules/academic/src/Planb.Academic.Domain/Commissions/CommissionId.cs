using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.Commissions;

/// <summary>
/// Strongly-typed identifier para <see cref="Commission"/> (US-065). Mismo pattern que TeacherId:
/// previene mezclar UUIDs entre aggregates/bounded contexts en compile-time.
/// </summary>
public readonly record struct CommissionId : IValueObject
{
    public Guid Value { get; private init; }

    public CommissionId(Guid value)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException("CommissionId cannot be empty.", nameof(value));
        }
        Value = value;
    }

    public static CommissionId New() => new(Guid.NewGuid());

    public override string ToString() => Value.ToString();
}
