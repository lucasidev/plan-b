namespace Planb.Planning.Domain.Drafts;

/// <summary>
/// Visibilidad de un <see cref="SimulationDraft"/>. Todo borrador nace y queda <see cref="Private"/>:
/// compartirlo (pasar a <see cref="Shared"/> y estampar <c>SharedAt</c>) es
/// <see cref="SimulationDraft.Share"/> (US-024). El campo vive en el modelo desde US-023, cuando
/// todavía no había forma de mutarlo.
/// </summary>
public enum SimulationVisibility
{
    Private,
    Shared,
}
