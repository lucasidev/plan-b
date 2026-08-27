using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Domain.Catalog;

/// <summary>
/// Strongly-typed identifier para <see cref="Instrument"/> (ADR-0082). La reseña lo guarda para
/// quedar atada a la versión del cuestionario con la que se respondió.
/// </summary>
public readonly record struct InstrumentId : IValueObject
{
    public Guid Value { get; private init; }

    public InstrumentId(Guid value)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException("InstrumentId cannot be empty.", nameof(value));
        }
        Value = value;
    }

    public static InstrumentId New() => new(Guid.NewGuid());

    public override string ToString() => Value.ToString();
}
