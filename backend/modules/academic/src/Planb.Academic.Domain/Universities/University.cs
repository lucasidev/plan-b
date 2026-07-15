using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.Universities;

/// <summary>
/// Aggregate root para una universidad del catálogo (UNSTA, SIGLO 21, etc). Expone Name + Slug +
/// InstitutionalEmailDomains + IsActive + timestamps. Branding, contacto y settings de moderación
/// se agregan cuando un caller real los requiera.
///
/// El aggregate vive en el bounded context Academic. Cross-BC references (StudentProfile.CareerId,
/// Review.SubjectId, etc.) son UUIDs sin FK Postgres, validados via IAcademicQueryService al
/// nivel application (ADR-0017).
///
/// <para>Soft delete vía <see cref="IsActive"/> (US-060, admin CRUD): careers/teachers referencian
/// la universidad por id sin FK cross-schema, así que hard-deletear dejaría filas colgadas.
/// Desactivar preserva la integridad histórica. No implementa un lifecycle rico
/// draft/beta/live/archived: eso es scope de US-091.</para>
/// </summary>
public sealed class University : Entity<UniversityId>, IAggregateRoot
{
    public string Name { get; private set; } = null!;
    public string Slug { get; private set; } = null!;

    /// <summary>
    /// Dominios de email institucional de la universidad (ej. <c>unsta.edu.ar</c>), en lowercase.
    /// Un docente verifica su identidad (US-031) mostrando que controla un email cuyo dominio está
    /// en esta lista. Vacío = la universidad no habilita verificación por email institucional (solo
    /// queda la manual, UC-066). La validación del dominio de un email contra esta lista vive en el
    /// flow de claim (Identity, <c>TeacherProfile.SubmitInstitutionalEmail</c>): la University solo
    /// es la fuente de verdad de qué dominios son válidos.
    /// </summary>
    public IReadOnlyList<string> InstitutionalEmailDomains { get; private set; } = [];

    public bool IsActive { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private University() { }

    /// <summary>
    /// Crea una nueva University. Validaciones mínimas (Name y Slug no blank). El detalle
    /// (length máximo, chars permitidos, formato del slug) se refina cuando un caller con
    /// requerimientos concretos lo justifique; hoy frena inputs degenerados. Los dominios se
    /// normalizan a lowercase y se deduplican. Arranca activa.
    /// </summary>
    public static Result<University> Create(
        string name,
        string slug,
        IReadOnlyList<string>? institutionalEmailDomains,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (string.IsNullOrWhiteSpace(name))
        {
            return UniversityErrors.NameRequired;
        }

        if (string.IsNullOrWhiteSpace(slug))
        {
            return UniversityErrors.SlugRequired;
        }

        var now = clock.UtcNow;
        return new University
        {
            Id = UniversityId.New(),
            Name = name.Trim(),
            Slug = slug.Trim().ToLowerInvariant(),
            InstitutionalEmailDomains = NormalizeDomains(institutionalEmailDomains),
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now,
        };
    }

    /// <summary>
    /// Reconstitución con un Id pre-asignado, para seeder y eventual EF rehydration. El seeder
    /// usa esto para mantener UUIDs determinísticos entre runs. Saltea las validaciones de
    /// <see cref="Create"/> intencionalmente: el caller se hace responsable de pasar datos
    /// consistentes (typically un seed cerrado o un repo cargando un row existente).
    /// </summary>
    public static University Hydrate(
        UniversityId id,
        string name,
        string slug,
        IReadOnlyList<string> institutionalEmailDomains,
        bool isActive,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt) =>
        new()
        {
            Id = id,
            Name = name,
            Slug = slug,
            InstitutionalEmailDomains = institutionalEmailDomains,
            IsActive = isActive,
            CreatedAt = createdAt,
            UpdatedAt = updatedAt,
        };

    /// <summary>
    /// Edición del catálogo (US-060, admin). Replace del form completo: re-valida Name/Slug
    /// (mismas reglas que <see cref="Create"/>) y re-normaliza los dominios institucionales.
    /// </summary>
    public Result Update(
        string name,
        string slug,
        IReadOnlyList<string>? institutionalEmailDomains,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (string.IsNullOrWhiteSpace(name))
        {
            return UniversityErrors.NameRequired;
        }

        if (string.IsNullOrWhiteSpace(slug))
        {
            return UniversityErrors.SlugRequired;
        }

        Name = name.Trim();
        Slug = slug.Trim().ToLowerInvariant();
        InstitutionalEmailDomains = NormalizeDomains(institutionalEmailDomains);
        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }

    /// <summary>Soft delete (US-060). Idempotencia explícita: re-desactivar devuelve error.</summary>
    public Result Deactivate(IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (!IsActive)
        {
            return UniversityErrors.AlreadyInactive;
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
            return UniversityErrors.AlreadyActive;
        }

        IsActive = true;
        UpdatedAt = clock.UtcNow;
        return Result.Success();
    }

    private static IReadOnlyList<string> NormalizeDomains(IReadOnlyList<string>? domains)
    {
        if (domains is null)
        {
            return [];
        }

        return domains
            .Where(d => !string.IsNullOrWhiteSpace(d))
            .Select(d => d.Trim().ToLowerInvariant())
            .Distinct()
            .ToList();
    }
}
