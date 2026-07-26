using Planb.SharedKernel.Primitives;

namespace Planb.Planning.Domain.Drafts;

/// <summary>Errores de negocio del aggregate <see cref="SimulationDraft"/> (US-023).</summary>
public static class SimulationDraftErrors
{
    public static readonly Error ItemsRequired =
        Error.Validation(
            "planning.simulation_draft.items_required",
            "A simulation draft needs at least one subject.");

    public static readonly Error DuplicateSubject =
        Error.Validation(
            "planning.simulation_draft.duplicate_subject",
            "A subject cannot appear twice in the same draft.");

    public static readonly Error LabelTooLong =
        Error.Validation(
            "planning.simulation_draft.label_too_long",
            $"Label must be at most {SimulationDraft.MaxLabelLength} characters.");

    /// <summary>Promote solo es válido desde <see cref="SimulationDraftStatus.Draft"/>. 409.</summary>
    public static readonly Error CannotPromote =
        Error.Conflict(
            "planning.simulation_draft.cannot_promote",
            "Only a draft in Draft status can be promoted.");

    /// <summary>Archive solo es válido desde <see cref="SimulationDraftStatus.Active"/>. 409.</summary>
    public static readonly Error CannotArchive =
        Error.Conflict(
            "planning.simulation_draft.cannot_archive",
            "Only a draft in Active status can be archived.");

    /// <summary>El borrador de la ruta no existe. 404.</summary>
    public static readonly Error NotFound =
        Error.NotFound(
            "planning.simulation_draft.not_found",
            "Simulation draft not found.");

    /// <summary>
    /// El borrador existe pero pertenece a otro alumno. 403 (no 404): la autorización dura de
    /// US-023 pide distinguir "no existe" de "no es tuyo".
    /// </summary>
    public static readonly Error NotOwner =
        Error.Forbidden(
            "planning.simulation_draft.not_owner",
            "You are not the owner of this simulation draft.");

    /// <summary>
    /// Alguna materia del borrador no pertenece al CareerPlan del alumno. 400 Validation: el
    /// recurso existe / se puede crear, lo que falla es el contenido enviado (mismo criterio que
    /// EvaluationErrors.SubjectNotInPlan del simulador).
    /// </summary>
    public static readonly Error SubjectNotInPlan =
        Error.Validation(
            "planning.simulation_draft.subject_not_in_plan",
            "One or more subjects do not belong to the student's career plan.");

    /// <summary>Rate limit de guardado excedido (60 saves/hora por user, US-023 AC). 429.</summary>
    public static readonly Error RateLimitExceeded =
        Error.Conflict(
            "planning.simulation_draft.rate_limit_exceeded",
            "Too many saves. Try again later.");
}
