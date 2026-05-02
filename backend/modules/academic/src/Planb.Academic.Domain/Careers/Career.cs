using Planb.Academic.Domain.Universities;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.Careers;

/// <summary>
/// Carrera ofrecida por una University (TUDCS, Ing. Sistemas, etc). Aggregate root separado de
/// University porque cada uno crece con su propio lifecycle: planes, materias, créditos y reglas
/// de prerequisites se modelan como aggregates paralelos cuando los necesite un caller real.
///
/// Referencia a University via UniversityId sin FK cross-aggregate (ADR-0017). Aggregate
/// plano, sin sub-entities. Subject + Prerequisite se diseñan como aggregates separados.
/// </summary>
public sealed class Career : Entity<CareerId>, IAggregateRoot
{
    public UniversityId UniversityId { get; private set; }
    public string Name { get; private set; } = null!;
    public string Slug { get; private set; } = null!;
    public DateTimeOffset CreatedAt { get; private set; }

    private Career() { }

    public static Result<Career> Create(
        UniversityId universityId,
        string name,
        string slug,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (string.IsNullOrWhiteSpace(name))
        {
            return CareerErrors.NameRequired;
        }

        if (string.IsNullOrWhiteSpace(slug))
        {
            return CareerErrors.SlugRequired;
        }

        return new Career
        {
            Id = CareerId.New(),
            UniversityId = universityId,
            Name = name.Trim(),
            Slug = slug.Trim().ToLowerInvariant(),
            CreatedAt = clock.UtcNow,
        };
    }

    public static Career Hydrate(
        CareerId id,
        UniversityId universityId,
        string name,
        string slug,
        DateTimeOffset createdAt) =>
        new()
        {
            Id = id,
            UniversityId = universityId,
            Name = name,
            Slug = slug,
            CreatedAt = createdAt,
        };
}
