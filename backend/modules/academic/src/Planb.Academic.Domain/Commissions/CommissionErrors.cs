using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.Commissions;

/// <summary>Errores de negocio del aggregate <see cref="Commission"/> (US-065).</summary>
public static class CommissionErrors
{
    public static readonly Error NameRequired =
        Error.Validation("academic.commission.name_required", "Commission name is required.");

    public static readonly Error NameTooLong =
        Error.Validation(
            "academic.commission.name_too_long",
            $"Commission name must be at most {Commission.MaxNameLength} characters.");

    public static readonly Error NotesTooLong =
        Error.Validation(
            "academic.commission.notes_too_long",
            $"Notes must be at most {Commission.MaxNotesLength} characters.");

    public static readonly Error CapacityNotPositive =
        Error.Validation(
            "academic.commission.capacity_not_positive",
            "Capacity must be greater than zero when present.");

    public static readonly Error TeacherAlreadyAssigned =
        Error.Conflict(
            "academic.commission.teacher_already_assigned",
            "That teacher is already assigned to this commission.");

    public static readonly Error TitularAlreadyAssigned =
        Error.Conflict(
            "academic.commission.titular_already_assigned",
            "This commission already has a titular teacher.");

    public static readonly Error TeacherNotAssigned =
        Error.NotFound(
            "academic.commission.teacher_not_assigned",
            "That teacher is not assigned to this commission.");

    public static readonly Error NotFound =
        Error.NotFound("academic.commission.not_found", "Commission not found.");

    public static readonly Error ScheduleInvalidRange =
        Error.Validation(
            "academic.commission.schedule_invalid_range",
            "A schedule block must end after it starts.");

    public static readonly Error ScheduleOverlap =
        Error.Conflict(
            "academic.commission.schedule_overlap",
            "Schedule blocks within a commission cannot overlap.");

    public static readonly Error AlreadyInactive =
        Error.Conflict("academic.commission.already_inactive", "Commission is already inactive.");

    public static readonly Error AlreadyActive =
        Error.Conflict("academic.commission.already_active", "Commission is already active.");

    /// <summary>
    /// Modality es obligatoria en el aggregate (mismo criterio que Subject.TermKind /
    /// AcademicTerm.Kind): la usa <c>CommissionEnumParsing</c> cuando el string del request viene
    /// vacío/null.
    /// </summary>
    public static readonly Error ModalityRequired =
        Error.Validation("academic.commission.modality_required", "Commission modality is required.");

    /// <summary>
    /// El subjectId del alta/edición no corresponde a ninguna Subject del catálogo. No hay FK
    /// cross-schema (ADR-0017), así que el application layer valida la existencia antes de crear.
    /// </summary>
    public static readonly Error SubjectNotFound =
        Error.NotFound(
            "academic.commission.subject_not_found",
            "The subject for this commission does not exist.");

    /// <summary>
    /// La materia existe pero está archivada (soft delete, US-062): no se pueden abrir comisiones
    /// nuevas sobre una materia que ya no se dicta.
    /// </summary>
    public static readonly Error SubjectInactive =
        Error.Conflict(
            "academic.commission.subject_inactive",
            "Cannot create a commission for an archived subject.");

    /// <summary>
    /// El docente existe pero está archivado (soft delete, US-063): no se le pueden asignar
    /// comisiones nuevas.
    ///
    /// <para>
    /// El chequeo faltaba mientras el de la materia sí estaba, y la asimetría tenía consecuencia
    /// real: archivar un docente lo saca de la búsqueda y del catálogo, pero su id sigue siendo
    /// válido, así que la asignación entraba igual y lo devolvía a la superficie del producto por
    /// la puerta de atrás (aparece como docente de la comisión, es reseñable, y sus reseñas nuevas
    /// cuentan en sus insights). Archivar dejaba de significar algo.
    /// </para>
    /// </summary>
    public static readonly Error TeacherInactive =
        Error.Conflict(
            "academic.commission.teacher_inactive",
            "Cannot assign an archived teacher to a commission.");

    /// <summary>El termId del alta no corresponde a ningún AcademicTerm del catálogo.</summary>
    public static readonly Error TermNotFound =
        Error.NotFound(
            "academic.commission.term_not_found",
            "The academic term for this commission does not exist.");

    /// <summary>
    /// El term_kind de la materia y el kind del período lectivo no coinciden (ej. una materia
    /// cuatrimestral no puede ofertarse en un período anual).
    /// </summary>
    public static readonly Error TermKindMismatch =
        Error.Validation(
            "academic.commission.term_kind_mismatch",
            "The academic term's kind does not match the subject's term_kind.");

    /// <summary>
    /// La materia, el período lectivo y cada docente asignado deben pertenecer a la misma
    /// universidad.
    /// </summary>
    public static readonly Error UniversityMismatch =
        Error.Validation(
            "academic.commission.university_mismatch",
            "The subject, academic term and every assigned teacher must belong to the same university.");

    /// <summary>Uno de los teacherId asignados no corresponde a ningún Teacher del catálogo.</summary>
    public static readonly Error TeacherNotFound =
        Error.NotFound(
            "academic.commission.teacher_not_found",
            "One of the assigned teachers does not exist.");

    /// <summary>El (subject_id, term_id, name) ya lo usa otra comisión. Refleja el UNIQUE de DB.</summary>
    public static readonly Error NameAlreadyExists =
        Error.Conflict(
            "academic.commission.name_already_exists",
            "Another commission for this subject and term already uses this name.");
}
