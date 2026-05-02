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
    public DateTimeOffset CreatedAt { get; private set; }

    private University() { }

    /// <summary>
    /// Crea una nueva University. Validaciones mínimas (Name y Slug no blank). El detalle
    /// (length máximo, chars permitidos, formato del slug) se refina cuando un caller con
    /// requerimientos concretos lo justifique; hoy frena inputs degenerados.
    /// </summary>
    public static Result<University> Create(string name, string slug, IDateTimeProvider clock)
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
        UniversityId id, string name, string slug, DateTimeOffset createdAt) =>
        new()
        {
            Id = id,
            Name = name,
            Slug = slug,
            CreatedAt = createdAt,
        };
}
