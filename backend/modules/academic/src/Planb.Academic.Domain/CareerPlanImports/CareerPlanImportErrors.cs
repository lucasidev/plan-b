using Planb.SharedKernel.Primitives;

namespace Planb.Academic.Domain.CareerPlanImports;

public static class CareerPlanImportErrors
{
    public static readonly Error PayloadTooLarge =
        Error.Validation(
            "academic.plan_import.payload_too_large",
            "El archivo supera el límite de 5 MB.");

    public static readonly Error EmptyPayload =
        Error.Validation(
            "academic.plan_import.empty_payload",
            "El archivo o texto está vacío.");

    public static readonly Error EncryptedPdf =
        Error.Validation(
            "academic.plan_import.encrypted",
            "El PDF está protegido con contraseña. Subí el original sin contraseña.");

    public static readonly Error InvalidPdf =
        Error.Validation(
            "academic.plan_import.invalid_pdf",
            "No pudimos leer el PDF. Probá con otro archivo o pegá el texto.");

    public static readonly Error UniversityNotFound =
        Error.NotFound(
            "academic.plan_import.university_not_found",
            "La universidad seleccionada no existe en el catálogo.");

    public static readonly Error CareerNameRequired =
        Error.Validation(
            "academic.plan_import.career_name_required",
            "Indicá el nombre de tu carrera.");

    public static readonly Error PlanYearOutOfRange =
        Error.Validation(
            "academic.plan_import.plan_year_out_of_range",
            "El año del plan está fuera de rango.");

    public static readonly Error NotFound =
        Error.NotFound(
            "academic.plan_import.not_found",
            "No encontramos ese import.");

    public static readonly Error NotOwnedByCaller =
        Error.Forbidden(
            "academic.plan_import.not_owned",
            "Ese import no pertenece a tu cuenta.");

    public static readonly Error NotReadyForApprove =
        Error.Conflict(
            "academic.plan_import.not_ready_for_approve",
            "El import no terminó de procesarse o ya fue aprobado.");

    public static readonly Error ParseTimedOut =
        Error.Validation(
            "academic.plan_import.timeout",
            "El procesamiento se pasó del tiempo límite. Reintentá o pegá menos materias.");

    public static readonly Error InvalidStateTransition =
        Error.Conflict(
            "academic.plan_import.invalid_state_transition",
            "El import está en un estado que no permite esta operación.");

    public static readonly Error PlanAlreadyExists =
        Error.Conflict(
            "academic.plan_import.plan_already_exists",
            "Ya existe un plan con esa carrera y año. Usá el plan existente o cambiá el año.");

    public static readonly Error NoItemsSelected =
        Error.Validation(
            "academic.plan_import.no_items_selected",
            "Elegí al menos una materia para crear el plan.");
}
