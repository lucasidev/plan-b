using Planb.SharedKernel.Primitives;

namespace Planb.Moderation.Domain.Reports;

/// <summary>
/// Strongly-typed identity for <see cref="ReviewReport"/>.
/// </summary>
public readonly record struct ReviewReportId : IValueObject
{
    public Guid Value { get; private init; }

    public ReviewReportId(Guid value)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException("ReviewReportId cannot be empty.", nameof(value));
        }
        Value = value;
    }

    public static ReviewReportId New() => new(Guid.NewGuid());

    public override string ToString() => Value.ToString();
}
