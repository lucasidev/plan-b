using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.Chairs;

/// <summary>Errores de negocio del aggregate <see cref="Chair"/> (US-196).</summary>
public static class ChairErrors
{
    public static readonly Error NameRequired =
        Error.Validation("academic.chair.name_required", "Chair name is required.");

    public static readonly Error NameTooLong =
        Error.Validation(
            "academic.chair.name_too_long",
            $"Chair name must be at most {Chair.MaxNameLength} characters.");

    public static readonly Error NotFound =
        Error.NotFound("academic.chair.not_found", "Chair not found.");

    public static readonly Error TeacherAlreadyInChair =
        Error.Conflict(
            "academic.chair.teacher_already_in_chair",
            "That teacher is already part of this chair.");

    public static readonly Error TeacherNotInChair =
        Error.NotFound(
            "academic.chair.teacher_not_in_chair",
            "That teacher is not part of this chair.");

    public static readonly Error LeadAlreadyAssigned =
        Error.Conflict(
            "academic.chair.lead_already_assigned",
            "This chair already has a lead teacher. Close the current one before naming another.");

    public static readonly Error AlreadyInactive =
        Error.Conflict("academic.chair.already_inactive", "Chair is already inactive.");

    public static readonly Error AlreadyActive =
        Error.Conflict("academic.chair.already_active", "Chair is already active.");

    /// <summary>
    /// El subjectId del alta no corresponde a ninguna Subject del catálogo. No hay FK cross-schema
    /// (ADR-0017) y la materia vive en otro aggregate, así que la existencia la valida el
    /// application layer antes de crear.
    /// </summary>
    public static readonly Error SubjectNotFound =
        Error.NotFound(
            "academic.chair.subject_not_found",
            "The subject for this chair does not exist.");

    /// <summary>La materia existe pero está archivada: no se abren cátedras sobre lo que ya no se dicta.</summary>
    public static readonly Error SubjectInactive =
        Error.Conflict(
            "academic.chair.subject_inactive",
            "Cannot create a chair for an archived subject.");

    /// <summary>Uno de los docentes del equipo no corresponde a ningún Teacher del catálogo.</summary>
    public static readonly Error TeacherNotFound =
        Error.NotFound(
            "academic.chair.teacher_not_found",
            "One of the chair members does not exist.");

    /// <summary>
    /// El docente existe pero está archivado (US-063). Archivar tiene que significar algo, y sumarlo
    /// a una cátedra lo devolvería a la superficie del producto.
    /// </summary>
    public static readonly Error TeacherInactive =
        Error.Conflict(
            "academic.chair.teacher_inactive",
            "Cannot add an archived teacher to a chair.");

    /// <summary>El termId del tramo no corresponde a ningún AcademicTerm del catálogo.</summary>
    public static readonly Error TermNotFound =
        Error.NotFound(
            "academic.chair.term_not_found",
            "The academic term for this chair member does not exist.");

    /// <summary>
    /// La materia y cada docente del equipo deben pertenecer a la misma universidad. Lo valida el
    /// application layer, que es el que puede ver los tres aggregates.
    /// </summary>
    public static readonly Error UniversityMismatch =
        Error.Validation(
            "academic.chair.university_mismatch",
            "The subject and every chair member must belong to the same university.");

    /// <summary>El (subject_id, name) ya lo usa otra cátedra. Refleja el UNIQUE de DB.</summary>
    public static readonly Error NameAlreadyExists =
        Error.Conflict(
            "academic.chair.name_already_exists",
            "Another chair for this subject already uses this name.");
}
