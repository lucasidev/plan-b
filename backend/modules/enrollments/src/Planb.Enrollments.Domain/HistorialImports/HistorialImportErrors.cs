using Planb.SharedKernel.Primitives;

namespace Planb.Enrollments.Domain.HistorialImports;

public static class HistorialImportErrors
{
    public static readonly Error PayloadTooLarge =
        Error.Validation(
            "enrollments.import.payload_too_large",
            "El archivo supera el límite de 5 MB.");

    public static readonly Error EmptyPayload =
        Error.Validation(
            "enrollments.import.empty_payload",
            "El archivo o texto está vacío.");

    public static readonly Error EncryptedPdf =
        Error.Validation(
            "enrollments.import.encrypted",
            "El PDF está protegido con contraseña. Subí el original sin contraseña.");

    public static readonly Error InvalidPdf =
        Error.Validation(
            "enrollments.import.invalid_pdf",
            "No pudimos leer el PDF. Probá con otro archivo o pegá el texto.");

    public static readonly Error StudentProfileRequired =
        Error.NotFound(
            "enrollments.import.student_profile_required",
            "Tu cuenta no tiene un perfil de estudiante activo.");

    public static readonly Error NotFound =
        Error.NotFound(
            "enrollments.import.not_found",
            "No encontramos ese import.");

    public static readonly Error NotOwnedByCaller =
        Error.Forbidden(
            "enrollments.import.not_owned",
            "Ese import no pertenece a tu cuenta.");

    public static readonly Error NotReadyForConfirm =
        Error.Conflict(
            "enrollments.import.not_ready_for_confirm",
            "El import no terminó de procesarse o ya fue confirmado.");

    public static readonly Error ParseTimedOut =
        Error.Validation(
            "enrollments.import.timeout",
            "El procesamiento se pasó del tiempo límite. Reintentá o pegá menos materias.");

    public static readonly Error InvalidStateTransition =
        Error.Conflict(
            "enrollments.import.invalid_state_transition",
            "El import está en un estado que no permite esta operación.");
}
