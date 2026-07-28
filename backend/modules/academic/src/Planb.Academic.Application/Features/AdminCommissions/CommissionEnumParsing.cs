using System.Globalization;
using Planb.Academic.Domain.Commissions;
using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Application.Features.AdminCommissions;

/// <summary>
/// Parseo de los enums y horarios que viajan como string en los requests de Commission (US-093).
/// Modality es obligatoria en el aggregate (mismo criterio que Subject.TermKind / AcademicTerm.Kind):
/// vacío devuelve <see cref="CommissionErrors.ModalityRequired"/>, un string no-vacío que no matchea
/// ningún valor DEFINIDO del enum se rechaza con un error de validación ad hoc (400, no se traga un
/// typo del admin). Role/Day/Time son campos de los items de las listas teachers/schedule: mismo
/// criterio de rechazo, pero sin constante de dominio propia para el caso "requerido" (a diferencia
/// de Modality, todavía no hay un segundo caller que justifique promoverla).
/// </summary>
internal static class CommissionEnumParsing
{
    public static Result<CommissionModality> ParseModality(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return CommissionErrors.ModalityRequired;
        }

        if (StrictEnum.TryParse<CommissionModality>(value, out var parsed))
        {
            return parsed;
        }

        return Error.Validation(
            "academic.commission.invalid_modality", $"'{value}' is not a valid modality.");
    }

    public static Result<CommissionTeacherRole> ParseTeacherRole(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return Error.Validation(
                "academic.commission.teacher_role_required", "Commission teacher role is required.");
        }

        if (StrictEnum.TryParse<CommissionTeacherRole>(value, out var parsed))
        {
            return parsed;
        }

        return Error.Validation(
            "academic.commission.invalid_teacher_role", $"'{value}' is not a valid teacher role.");
    }

    public static Result<DayOfWeek> ParseDay(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return Error.Validation(
                "academic.commission.schedule_day_required", "Schedule day is required.");
        }

        if (StrictEnum.TryParse<DayOfWeek>(value, out var parsed))
        {
            return parsed;
        }

        return Error.Validation(
            "academic.commission.invalid_schedule_day", $"'{value}' is not a valid day of week.");
    }

    /// <summary>
    /// Hora "HH:mm" de un bloque horario. <paramref name="fieldName"/> es "start" o "end", solo para
    /// el mensaje de error.
    /// </summary>
    public static Result<TimeOnly> ParseTime(string? value, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return Error.Validation(
                "academic.commission.schedule_time_required", $"Schedule {fieldName} time is required.");
        }

        if (TimeOnly.TryParseExact(
            value, "HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed))
        {
            return parsed;
        }

        return Error.Validation(
            "academic.commission.invalid_schedule_time",
            $"'{value}' is not a valid HH:mm {fieldName} time.");
    }
}
