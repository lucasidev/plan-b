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
    /// <summary>
    /// True cuando la carrera la creó el backoffice (admin/staff). False cuando la creó un
    /// alumno via crowdsourcing (US-088). El frontend muestra badge "No oficial" cuando es
    /// false. Cuando un admin acepta la versión crowdsourced, llama <see cref="MarkOfficial"/>.
    /// </summary>
    public bool IsOfficial { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }

    private Career() { }

    public static Result<Career> Create(
        UniversityId universityId,
        string name,
        string slug,
        IDateTimeProvider clock,
        bool isOfficial = true)
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
            IsOfficial = isOfficial,
            CreatedAt = clock.UtcNow,
        };
    }

    /// <summary>
    /// Promueve una carrera no-oficial (creada via crowdsourcing) a oficial. Idempotente: si ya
    /// estaba oficial, no hace nada. Lo usa el flujo de backoffice cuando un admin valida una
    /// carrera subida por alumno.
    /// </summary>
    public void MarkOfficial()
    {
        if (!IsOfficial) IsOfficial = true;
    }

    public static Career Hydrate(
        CareerId id,
        UniversityId universityId,
        string name,
        string slug,
        bool isOfficial,
        DateTimeOffset createdAt) =>
        new()
        {
            Id = id,
            UniversityId = universityId,
            Name = name,
            Slug = slug,
            IsOfficial = isOfficial,
            CreatedAt = createdAt,
        };
}
