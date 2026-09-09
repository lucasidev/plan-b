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
    // varchar(120), address varchar(300), locality_id/locality_name varchar(80). Compartida por
    // el aggregate y el validator para que ninguno acepte lo que la columna despues rechaza con
    // un 500 de Postgres.
    public const int MaxNameLength = 200;
    public const int MaxSlugLength = 120;
    public const int MaxAddressLength = 300;
    public const int MaxLocalityLength = 80;

    public UniversityId UniversityId { get; private set; }
    public string Name { get; private set; } = null!;
    public string Slug { get; private set; } = null!;

    /// <summary>Domicilio tal como lo publica la fuente (R6, tarea 19), sin normalizar: es la evidencia.</summary>
    public string Address { get; private set; } = null!;

    /// <summary>
    /// Id de Georef de la localidad que <see cref="Address"/> nombra. Null hasta que
    /// <see cref="ResolveLocality"/> corre (o si Georef nunca la resolvió): una unidad sin
    /// localidad resuelta es válida, y se sabe que no se resolvió.
    /// </summary>
    public string? LocalityId { get; private set; }

    /// <summary>Nombre canónico de Georef para <see cref="LocalityId"/> (ej. "San Miguel de Tucumán").</summary>
    public string? LocalityName { get; private set; }

    public bool IsActive { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private AcademicUnit() { }

    public static Result<AcademicUnit> Create(
        UniversityId universityId,
        string name,
        string slug,
        string address,
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

        if (string.IsNullOrWhiteSpace(address))
        {
            return AcademicUnitErrors.AddressRequired;
        }

        var now = clock.UtcNow;
        return new AcademicUnit
        {
            Id = AcademicUnitId.New(),
            UniversityId = universityId,
            Name = name.Trim(),
            Slug = slug.Trim().ToLowerInvariant(),
            Address = address.Trim(),
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

    /// <summary>
    /// Guarda la localidad que el resolvedor de Georef encontró para <see cref="Address"/> (tarea
    /// 19). Id y nombre viajan juntos porque son el mismo hallazgo: no hay estado donde uno esté
    /// resuelto y el otro no.
    /// </summary>
    public Result ResolveLocality(string localityId, string localityName, IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (string.IsNullOrWhiteSpace(localityId) || string.IsNullOrWhiteSpace(localityName))
        {
            return AcademicUnitErrors.LocalityRequired;
        }

        LocalityId = localityId.Trim();
        LocalityName = localityName.Trim();
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
        string address,
        string? localityId,
        string? localityName,
        bool isActive,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt) =>
        new()
        {
            Id = id,
            UniversityId = universityId,
            Name = name,
            Slug = slug,
            Address = address,
            LocalityId = localityId,
            LocalityName = localityName,
            IsActive = isActive,
            CreatedAt = createdAt,
            UpdatedAt = updatedAt,
        };
}
