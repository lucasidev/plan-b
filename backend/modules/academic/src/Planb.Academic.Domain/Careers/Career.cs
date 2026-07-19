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
///
/// <para>Soft delete vía <see cref="IsActive"/> (US-061, admin CRUD): CareerPlans y Subjects
/// referencian la carrera por id sin FK cross-schema, así que hard-deletear dejaría filas
/// colgadas. Desactivar preserva la integridad histórica.</para>
/// </summary>
public sealed class Career : Entity<CareerId>, IAggregateRoot
{
    public UniversityId UniversityId { get; private set; }
    public string Name { get; private set; } = null!;
    public string Slug { get; private set; } = null!;

    /// <summary>
    /// Nombre corto de la carrera (ej. "Ing. Sistemas"). Opcional en el aggregate porque el
    /// crowdsourcing (US-088) crea carreras solo con name/slug; el form de admin (US-061) lo exige
    /// vía su validator.
    /// </summary>
    public string? ShortName { get; private set; }

    /// <summary>
    /// Código institucional de la carrera (ej. "TUDCS"). Opcional, pero único por university cuando
    /// se provee: constraint UNIQUE(university_id, code). Permite distinguir carreras con códigos
    /// oficiales sin obligar.
    /// </summary>
    public string? Code { get; private set; }

    /// <summary>
    /// True cuando la carrera la creó el backoffice (admin/staff). False cuando la creó un
    /// alumno via crowdsourcing (US-088). El frontend muestra badge "No oficial" cuando es
    /// false. Cuando un admin acepta la versión crowdsourced, llama <see cref="MarkOfficial"/>.
    /// </summary>
    public bool IsOfficial { get; private set; }

    /// <summary>Soft delete (US-061). Arranca activa; <see cref="Deactivate"/> la archiva.</summary>
    public bool IsActive { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private Career() { }

    public static Result<Career> Create(
        UniversityId universityId,
        string name,
        string slug,
        IDateTimeProvider clock,
        bool isOfficial = true,
        string? shortName = null,
        string? code = null)
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

        var now = clock.UtcNow;
        return new Career
        {
            Id = CareerId.New(),
            UniversityId = universityId,
            Name = name.Trim(),
            Slug = slug.Trim().ToLowerInvariant(),
            ShortName = NormalizeOptional(shortName),
            Code = NormalizeOptional(code),
            IsOfficial = isOfficial,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now,
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

    /// <summary>
    /// Edición del catálogo (US-061, admin). Replace del form completo: re-valida Name/Slug
    /// (mismas reglas que <see cref="Create"/>) y re-normaliza shortName/code.
    /// </summary>
    public Result Update(
        string name,
        string slug,
        string? shortName,
        string? code,
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

        Name = name.Trim();
        Slug = slug.Trim().ToLowerInvariant();
        ShortName = NormalizeOptional(shortName);
        Code = NormalizeOptional(code);
        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }

    /// <summary>Soft delete (US-061). Idempotencia explícita: re-desactivar devuelve error.</summary>
    public Result Deactivate(IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (!IsActive)
        {
            return CareerErrors.AlreadyInactive;
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
            return CareerErrors.AlreadyActive;
        }

        IsActive = true;
        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }

    public static Career Hydrate(
        CareerId id,
        UniversityId universityId,
        string name,
        string slug,
        string? shortName,
        string? code,
        bool isOfficial,
        bool isActive,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt) =>
        new()
        {
            Id = id,
            UniversityId = universityId,
            Name = name,
            Slug = slug,
            ShortName = shortName,
            Code = code,
            IsOfficial = isOfficial,
            IsActive = isActive,
            CreatedAt = createdAt,
            UpdatedAt = updatedAt,
        };

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
