using Planb.SharedKernel.Primitives;

namespace Planb.Enrollments.Domain.HistorialImports;

public readonly record struct HistorialImportId : IValueObject
{
    public Guid Value { get; private init; }

    public HistorialImportId(Guid value)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException("HistorialImportId cannot be empty.", nameof(value));
        }
        Value = value;
    }

    public static HistorialImportId New() => new(Guid.NewGuid());

    public override string ToString() => Value.ToString();
}
