namespace Planb.Reviews.Application.Features.ChairsNearFloor;

/// <summary>
/// Una cátedra a una reseña de cruzar el piso de publicación (US-134): agregado público, el
/// conteo nomás, listo para mostrar sin exponer nada de quién reseñó.
/// </summary>
public sealed record ChairNearFloorView(
    Guid ChairId,
    string ChairName,
    Guid SubjectId,
    string SubjectName,
    int ReviewCount);
