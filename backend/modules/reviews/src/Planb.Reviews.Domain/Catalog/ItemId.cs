using Planb.SharedKernel.Primitives;

namespace Planb.Reviews.Domain.Catalog;

/// <summary>
/// Strongly-typed identifier para <see cref="Item"/> (US-198, ADR-0082). Es la clave técnica; la
/// identidad SEMÁNTICA de la frase es su <see cref="Item.Code"/>, que es lo que ata una serie histórica
/// y lo que se corta cuando el significado cambia.
/// </summary>
public readonly record struct ItemId : IValueObject
{
    public Guid Value { get; private init; }

    public ItemId(Guid value)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException("ItemId cannot be empty.", nameof(value));
        }
        Value = value;
    }

    public static ItemId New() => new(Guid.NewGuid());

    public override string ToString() => Value.ToString();
}
