using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Domain.Reviews;

/// <summary>
/// Strongly-typed identifier para <see cref="Review"/> (ADR-0082). Nunca sale publicado: lo
/// que la ficha muestra son conteos, jamás una reseña individual. Existe para que el autor pueda
/// editar o borrar la suya.
/// </summary>
public readonly record struct ReviewId : IValueObject
{
    public Guid Value { get; private init; }

    public ReviewId(Guid value)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException("ReviewId cannot be empty.", nameof(value));
        }
        Value = value;
    }

    public static ReviewId New() => new(Guid.NewGuid());

    public override string ToString() => Value.ToString();
}
