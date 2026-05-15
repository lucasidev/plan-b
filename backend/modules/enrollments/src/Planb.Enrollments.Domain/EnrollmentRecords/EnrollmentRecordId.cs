using Planb.SharedKernel.Primitives;

namespace Planb.Enrollments.Domain.EnrollmentRecords;

public readonly record struct EnrollmentRecordId : IValueObject
{
    public Guid Value { get; private init; }

    public EnrollmentRecordId(Guid value)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException("EnrollmentRecordId cannot be empty.", nameof(value));
        }
        Value = value;
    }

    public static EnrollmentRecordId New() => new(Guid.NewGuid());

    public override string ToString() => Value.ToString();
}
