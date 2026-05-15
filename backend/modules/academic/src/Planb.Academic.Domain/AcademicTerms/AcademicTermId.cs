using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.AcademicTerms;

public readonly record struct AcademicTermId : IValueObject
{
    public Guid Value { get; private init; }

    public AcademicTermId(Guid value)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException("AcademicTermId cannot be empty.", nameof(value));
        }
        Value = value;
    }

    public static AcademicTermId New() => new(Guid.NewGuid());

    public override string ToString() => Value.ToString();
}
