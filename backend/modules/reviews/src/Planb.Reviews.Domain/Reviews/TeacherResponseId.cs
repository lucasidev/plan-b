using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Domain.Reviews;

/// <summary>Strongly-typed identifier de <see cref="TeacherResponse"/> (US-040).</summary>
public readonly record struct TeacherResponseId : IValueObject
{
    public Guid Value { get; private init; }

    public TeacherResponseId(Guid value)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException("TeacherResponseId cannot be empty.", nameof(value));
        }
        Value = value;
    }

    public static TeacherResponseId New() => new(Guid.NewGuid());

    public override string ToString() => Value.ToString();
}
