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
/// <para>Atributos académicos (US-061, mock AdmOnbCarrera): <see cref="DegreeType"/>,
/// <see cref="DurationYears"/>, <see cref="Modality"/> (reusa <see cref="TermKind"/>) y
/// <see cref="Description"/>. Todos nullable: el crowdsourcing (US-088) crea carreras solo con
/// name/slug, el form de admin los completa. El lifecycle draft/beta/live NO va acá (es US-091);
/// el soft delete es <see cref="IsActive"/>.</para>
/// </summary>
public sealed class Career : Entity<CareerId>, IAggregateRoot
{
    public UniversityId UniversityId { get; private set; }
    public string Name { get; private set; } = null!;
    public string Slug { get; private set; } = null!;

    /// <summary>
    /// Nombre corto (ej. "Ing. Sistemas"). Opcional: el crowdsourcing lo deja null, el form admin
    /// lo exige vía su validator.
    /// </summary>
    public string? ShortName { get; private set; }

    /// <summary>
    /// Código institucional (ej. "TUDCS"). Opcional, único por university cuando se provee:
    /// constraint UNIQUE(university_id, code).
    /// </summary>
    public string? Code { get; private set; }

    /// <summary>Tipo de título (US-061). Nullable: el crowdsourcing no lo carga.</summary>
    public CareerDegreeType? DegreeType { get; private set; }

    /// <summary>Duración nominal en años (US-061). Nullable en crowdsourcing; rango 1-15 al validar.</summary>
    public int? DurationYears { get; private set; }

    /// <summary>
    /// Cadencia mayoritaria de la carrera (US-061). Reusa <see cref="TermKind"/>, el mismo enum que
    /// <see cref="AcademicTerms.AcademicTerm.Kind"/> y <see cref="Subjects.Subject"/>. Nullable en
    /// crowdsourcing.
    /// </summary>
    public TermKind? Modality { get; private set; }

    /// <summary>Descripción corta visible al alumno (US-061). Opcional.</summary>
    public string? Description { get; private set; }

    /// <summary>
    /// True cuando la carrera la creó el backoffice (admin/staff). False cuando la creó un
    /// alumno via crowdsourcing (US-088). El frontend muestra badge "No oficial" cuando es false.
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
        string? code = null,
        CareerDegreeType? degreeType = null,
        int? durationYears = null,
        TermKind? modality = null,
        string? description = null)
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

        var durationCheck = ValidateDuration(durationYears);
        if (durationCheck.IsFailure)
        {
            return durationCheck.Error;
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
            DegreeType = degreeType,
            DurationYears = durationYears,
            Modality = modality,
            Description = NormalizeOptional(description),
            IsOfficial = isOfficial,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now,
        };
    }

    /// <summary>
    /// Promueve una carrera no-oficial (creada via crowdsourcing) a oficial. Idempotente.
    /// </summary>
    public void MarkOfficial()
    {
        if (!IsOfficial) IsOfficial = true;
    }

    /// <summary>
    /// Edición del catálogo (US-061, admin). Replace del form completo: re-valida Name/Slug +
    /// duración, y re-normaliza los campos de texto.
    /// </summary>
    public Result Update(
        string name,
        string slug,
        string? shortName,
        string? code,
        CareerDegreeType? degreeType,
        int? durationYears,
        TermKind? modality,
        string? description,
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

        var durationCheck = ValidateDuration(durationYears);
        if (durationCheck.IsFailure)
        {
            return durationCheck.Error;
        }

        Name = name.Trim();
        Slug = slug.Trim().ToLowerInvariant();
        ShortName = NormalizeOptional(shortName);
        Code = NormalizeOptional(code);
        DegreeType = degreeType;
        DurationYears = durationYears;
        Modality = modality;
        Description = NormalizeOptional(description);
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
        CareerDegreeType? degreeType,
        int? durationYears,
        TermKind? modality,
        string? description,
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
            DegreeType = degreeType,
            DurationYears = durationYears,
            Modality = modality,
            Description = description,
            IsOfficial = isOfficial,
            IsActive = isActive,
            CreatedAt = createdAt,
            UpdatedAt = updatedAt,
        };

    private static Result ValidateDuration(int? durationYears)
    {
        if (durationYears is { } d && (d < 1 || d > 15))
        {
            return CareerErrors.DurationYearsOutOfRange;
        }

        return Result.Success();
    }

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
