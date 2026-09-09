using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.AcademicUnits;

public static class AcademicUnitErrors
{
    public static readonly Error NameRequired =
        Error.Validation("academic.academic_unit.name_required", "Academic unit name is required.");

    public static readonly Error SlugRequired =
        Error.Validation("academic.academic_unit.slug_required", "Academic unit slug is required.");

    public static readonly Error AddressRequired =
        Error.Validation("academic.academic_unit.address_required", "Academic unit address is required.");

    /// <summary>
    /// Id y nombre de localidad de Georef viajan juntos (<see cref="AcademicUnit.ResolveLocality"/>):
    /// no hay un estado válido donde uno esté resuelto y el otro no.
    /// </summary>
    public static readonly Error LocalityRequired =
        Error.Validation(
            "academic.academic_unit.locality_required",
            "Locality id and name are both required to resolve a locality.");

    public static readonly Error NotFound =
        Error.NotFound("academic.academic_unit.not_found", "Academic unit not found.");

    /// <summary>
    /// El (university_id, slug) ya lo usa otra AcademicUnit de la misma universidad. Se chequea en
    /// el handler vía el repo antes de crear/actualizar (mismo criterio que Career, ADR-0017).
    /// </summary>
    public static readonly Error SlugAlreadyTaken =
        Error.Conflict(
            "academic.academic_unit.slug_already_taken",
            "An academic unit with that slug already exists in this university.");

    public static readonly Error AlreadyInactive =
        Error.Conflict("academic.academic_unit.already_inactive", "Academic unit is already inactive.");

    public static readonly Error AlreadyActive =
        Error.Conflict("academic.academic_unit.already_active", "Academic unit is already active.");

    /// <summary>
    /// El university_id no corresponde a ninguna University del catálogo. No hay FK cross-aggregate
    /// (ADR-0017), así que el application layer valida la existencia antes de crear.
    /// </summary>
    public static readonly Error UniversityNotFound =
        Error.NotFound(
            "academic.academic_unit.university_not_found",
            "The university for this academic unit does not exist.");
}
