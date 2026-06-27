using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.Universities;

/// <summary>
/// Aggregate root para una universidad del catálogo (UNSTA, SIGLO 21, etc). Hoy expone Name +
/// Slug + timestamps. Branding, contacto y settings de moderación se agregan cuando un caller
/// real los requiera.
///
/// El aggregate vive en el bounded context Academic. Cross-BC references (StudentProfile.CareerId,
/// Review.SubjectId, etc.) son UUIDs sin FK Postgres, validados via IAcademicQueryService al
/// nivel application (ADR-0017).
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

    public DateTimeOffset CreatedAt { get; private set; }

    private University() { }

    /// <summary>
    /// Crea una nueva University. Validaciones mínimas (Name y Slug no blank). El detalle
    /// (length máximo, chars permitidos, formato del slug) se refina cuando un caller con
    /// requerimientos concretos lo justifique; hoy frena inputs degenerados. Los dominios se
    /// normalizan a lowercase y se deduplican.
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

        return new University
        {
            Id = UniversityId.New(),
            Name = name.Trim(),
            Slug = slug.Trim().ToLowerInvariant(),
            InstitutionalEmailDomains = NormalizeDomains(institutionalEmailDomains),
            CreatedAt = clock.UtcNow,
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
        DateTimeOffset createdAt) =>
        new()
        {
            Id = id,
            Name = name,
            Slug = slug,
            InstitutionalEmailDomains = institutionalEmailDomains,
            CreatedAt = createdAt,
        };

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
