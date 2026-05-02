using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.CareerPlans;

public readonly record struct CareerPlanId : IValueObject
{
    public Guid Value { get; private init; }

    public CareerPlanId(Guid value)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException("CareerPlanId cannot be empty.", nameof(value));
        }
        Value = value;
    }

    public static CareerPlanId New() => new(Guid.NewGuid());

    public override string ToString() => Value.ToString();
}
