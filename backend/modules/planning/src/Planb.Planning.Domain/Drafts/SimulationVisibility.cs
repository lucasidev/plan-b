namespace Planb.Planning.Domain.Drafts;

/// <summary>
/// Visibilidad de un <see cref="SimulationDraft"/>. Todo borrador nace y queda <see cref="Private"/>:
/// compartirlo (pasar a <see cref="Shared"/> y estampar <c>SharedAt</c>) es US-024, que todavía no
/// tiene endpoints. El campo vive en el modelo desde US-023 para no migrar la tabla de nuevo cuando
/// US-024 aterrice.
/// </summary>
public enum SimulationVisibility
{
    Private,
    Shared,
}
