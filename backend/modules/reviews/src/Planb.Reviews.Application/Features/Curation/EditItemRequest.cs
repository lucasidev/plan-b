namespace Planb.Reviews.Application.Features.Curation;

/// <summary>
/// El body de editar una frase. Sin el código: no se toca, y aceptarlo invitaría a mandarlo cambiado
/// creyendo que eso es la edición, cuando cambiar el código es el otro camino.
/// </summary>
public sealed record EditItemRequest(
    string Text,
    string? Help,
    string Layer,
    IReadOnlyList<CuratedOptionRequest> Options);
