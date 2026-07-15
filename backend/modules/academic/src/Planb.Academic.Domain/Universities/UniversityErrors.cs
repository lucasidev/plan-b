using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.Universities;

public static class UniversityErrors
{
    public static readonly Error NameRequired =
        Error.Validation("academic.university.name_required", "University name is required.");

    public static readonly Error SlugRequired =
        Error.Validation("academic.university.slug_required", "University slug is required.");

    public static readonly Error NotFound =
        Error.NotFound("academic.university.not_found", "University not found.");

    /// <summary>
    /// El slug ya lo usa otra University del catálogo (unique constraint). Se chequea en el
    /// handler vía el repositorio antes de crear/actualizar el aggregate (ADR-0017: no hay
    /// constraint UNIQUE enforceable desde otro schema, pero acá sí es intra-schema).
    /// </summary>
    public static readonly Error SlugAlreadyTaken =
        Error.Conflict(
            "academic.university.slug_already_taken",
            "A university with that slug already exists.");

    public static readonly Error AlreadyInactive =
        Error.Conflict("academic.university.already_inactive", "University is already inactive.");

    public static readonly Error AlreadyActive =
        Error.Conflict("academic.university.already_active", "University is already active.");
}
