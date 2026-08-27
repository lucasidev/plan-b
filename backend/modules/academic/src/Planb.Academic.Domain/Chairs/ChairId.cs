using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.Chairs;

/// <summary>
/// Strongly-typed identifier para <see cref="Chair"/> (US-196). Mismo pattern que TeacherId. La
/// reseña ancla su cátedra por este id (cross-BC, sin FK Postgres, ADR-0017), y es la clave con la
/// que la ficha de cátedra agrupa sus conteos.
/// </summary>
public readonly record struct ChairId : IValueObject
{
    public Guid Value { get; private init; }

    public ChairId(Guid value)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException("ChairId cannot be empty.", nameof(value));
        }
        Value = value;
    }

    public static ChairId New() => new(Guid.NewGuid());

    public override string ToString() => Value.ToString();
}
