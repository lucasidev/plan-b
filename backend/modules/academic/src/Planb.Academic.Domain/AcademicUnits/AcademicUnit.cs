using Planb.Academic.Domain.Universities;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.AcademicUnits;

/// <summary>
/// Aggregate root para una unidad académica (facultad): el nivel entre la institución y la carrera
/// que ADR-0085 declaró ("las carreras cuelgan de ella") y ADR-0090 termina de construir, porque
/// una unidad académica es uno de los tres sujetos posibles de un <c>OfficialFact</c>
/// (los datos de transparencia de una facultad, como la nómina de UNT, se cuelgan acá).
///
/// Referencia a University via UniversityId sin FK cross-aggregate (ADR-0017), mismo patrón que
/// Career. Aggregate plano, sin sub-entities.
/// </summary>
public sealed class AcademicUnit : Entity<AcademicUnitId>, IAggregateRoot
{
    // Mismo largo que las columnas EF (AcademicUnitConfiguration): name varchar(200), slug
    // varchar(120). Compartida por el aggregate y el validator para que ninguno acepte lo que la
    // columna despues rechaza con un 500 de Postgres.
    public const int MaxNameLength = 200;
    public const int MaxSlugLength = 120;

    public UniversityId UniversityId { get; private set; }
    public string Name { get; private set; } = null!;
    public string Slug { get; private set; } = null!;
    public bool IsActive { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private AcademicUnit() { }

    public static Result<AcademicUnit> Create(
        UniversityId universityId,
        string name,
        string slug,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (string.IsNullOrWhiteSpace(name))
        {
            return AcademicUnitErrors.NameRequired;
        }

        if (string.IsNullOrWhiteSpace(slug))
        {
            return AcademicUnitErrors.SlugRequired;
        }

        var now = clock.UtcNow;
        return new AcademicUnit
        {
            Id = AcademicUnitId.New(),
            UniversityId = universityId,
            Name = name.Trim(),
            Slug = slug.Trim().ToLowerInvariant(),
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now,
        };
    }

    /// <summary>Edición del catálogo. Replace del form completo: re-valida Name/Slug.</summary>
    public Result Update(string name, string slug, IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (string.IsNullOrWhiteSpace(name))
        {
            return AcademicUnitErrors.NameRequired;
        }

        if (string.IsNullOrWhiteSpace(slug))
        {
            return AcademicUnitErrors.SlugRequired;
        }

        Name = name.Trim();
        Slug = slug.Trim().ToLowerInvariant();
        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }

    /// <summary>Soft delete. Idempotencia explícita: re-desactivar devuelve error.</summary>
    public Result Deactivate(IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (!IsActive)
        {
            return AcademicUnitErrors.AlreadyInactive;
        }

        IsActive = false;
        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }

    public Result Reactivate(IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (IsActive)
        {
            return AcademicUnitErrors.AlreadyActive;
        }

        IsActive = true;
        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }

    /// <summary>Reconstitución con un Id pre-asignado, para seeder y EF rehydration.</summary>
    public static AcademicUnit Hydrate(
        AcademicUnitId id,
        UniversityId universityId,
        string name,
        string slug,
        bool isActive,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt) =>
        new()
        {
            Id = id,
            UniversityId = universityId,
            Name = name,
            Slug = slug,
            IsActive = isActive,
            CreatedAt = createdAt,
            UpdatedAt = updatedAt,
        };
}
