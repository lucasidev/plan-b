using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.Teachers;

/// <summary>
/// Strongly-typed identifier para <see cref="Teacher"/> (US-063). Mismo pattern que UniversityId:
/// previene mezclar UUIDs entre bounded contexts en compile-time. Las reseñas referencian al
/// docente por este id (cross-BC, sin FK Postgres, ADR-0017).
/// </summary>
public readonly record struct TeacherId : IValueObject
{
    public Guid Value { get; private init; }

    public TeacherId(Guid value)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException("TeacherId cannot be empty.", nameof(value));
        }
        Value = value;
    }

    public static TeacherId New() => new(Guid.NewGuid());

    public override string ToString() => Value.ToString();
}
