using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.Careers;

public static class CareerErrors
{
    public static readonly Error NameRequired =
        Error.Validation("academic.career.name_required", "Career name is required.");

    public static readonly Error SlugRequired =
        Error.Validation("academic.career.slug_required", "Career slug is required.");

    public static readonly Error NotFound =
        Error.NotFound("academic.career.not_found", "Career not found.");

    /// <summary>
    /// El (university_id, slug) ya lo usa otra Career de la misma universidad. Se chequea en el
    /// handler vía el repo antes de crear/actualizar. Intra-schema, así que también hay UNIQUE en DB.
    /// </summary>
    public static readonly Error SlugAlreadyTaken =
        Error.Conflict(
            "academic.career.slug_already_taken",
            "A career with that slug already exists in this university.");

    /// <summary>
    /// El code institucional (opcional) ya lo usa otra Career de la misma universidad.
    /// Constraint UNIQUE(university_id, code) cuando el code no es null.
    /// </summary>
    public static readonly Error CodeAlreadyTaken =
        Error.Conflict(
            "academic.career.code_already_taken",
            "A career with that code already exists in this university.");

    public static readonly Error AlreadyInactive =
        Error.Conflict("academic.career.already_inactive", "Career is already inactive.");

    public static readonly Error AlreadyActive =
        Error.Conflict("academic.career.already_active", "Career is already active.");

    public static readonly Error DurationYearsOutOfRange =
        Error.Validation(
            "academic.career.duration_years_out_of_range",
            "Career duration in years must be between 1 and 15.");

    /// <summary>
    /// El university_id de la ruta no corresponde a ninguna University del catálogo. No hay FK
    /// cross-schema (ADR-0017), así que el application layer valida la existencia antes de crear.
    /// </summary>
    public static readonly Error UniversityNotFound =
        Error.NotFound(
            "academic.career.university_not_found",
            "The university for this career does not exist.");
}
