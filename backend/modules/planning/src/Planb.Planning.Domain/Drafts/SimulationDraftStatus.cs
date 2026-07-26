namespace Planb.Planning.Domain.Drafts;

/// <summary>
/// Lifecycle de un <see cref="SimulationDraft"/> (US-023). <see cref="Draft"/>: borrador privado
/// editable, todavía no es "el plan" del alumno. <see cref="Active"/>: el alumno lo promovió a su
/// plan vigente para ese AcademicTerm (a lo sumo uno por owner+term; promover otro archiva este).
/// <see cref="Archived"/>: reemplazado por otro Active, ya no es el vigente.
/// </summary>
public enum SimulationDraftStatus
{
    Draft,
    Active,
    Archived,
}
