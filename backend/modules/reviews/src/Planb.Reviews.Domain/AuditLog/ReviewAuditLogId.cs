using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Domain.AuditLog;

public readonly record struct ReviewAuditLogId : IValueObject
{
    public Guid Value { get; private init; }

    public ReviewAuditLogId(Guid value)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException("ReviewAuditLogId cannot be empty.", nameof(value));
        }
        Value = value;
    }

    public static ReviewAuditLogId New() => new(Guid.NewGuid());

    public override string ToString() => Value.ToString();
}
