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
}
