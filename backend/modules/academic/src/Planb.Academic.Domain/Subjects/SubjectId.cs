using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.Subjects;

public readonly record struct SubjectId : IValueObject
{
    public Guid Value { get; private init; }

    public SubjectId(Guid value)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException("SubjectId cannot be empty.", nameof(value));
        }
        Value = value;
    }

    public static SubjectId New() => new(Guid.NewGuid());

    public override string ToString() => Value.ToString();
}
