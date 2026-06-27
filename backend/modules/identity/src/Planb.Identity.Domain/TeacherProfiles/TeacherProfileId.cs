using Planb.SharedKernel.Primitives;

namespace Planb.Identity.Domain.TeacherProfiles;

/// <summary>
/// Strongly-typed identifier para <see cref="TeacherProfile"/> (US-030). Mismo pattern que
/// StudentProfileId: previene mezclar UUIDs entre aggregates / bounded contexts en compile-time.
/// </summary>
public readonly record struct TeacherProfileId : IValueObject
{
    public Guid Value { get; private init; }

    public TeacherProfileId(Guid value)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException("TeacherProfileId cannot be empty.", nameof(value));
        }
        Value = value;
    }

    public static TeacherProfileId New() => new(Guid.NewGuid());

    public override string ToString() => Value.ToString();
}
