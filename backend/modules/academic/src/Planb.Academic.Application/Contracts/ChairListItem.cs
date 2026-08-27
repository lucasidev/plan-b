namespace Planb.Academic.Application.Contracts;

/// <summary>
/// Una cátedra activa de una materia, con su titular vigente (US-196): el chair_member con role
/// Lead y sin cierre (until_term_id null). Caller: el picker de cátedra de Reseñar ("cursé con
/// Pérez"). Sin titular nombrado, los tres campos de docente vienen null: la cátedra existe igual.
/// Los nombres vienen en title case listos para display (el storage es lowercase normalizado).
/// </summary>
public sealed record ChairListItem(
    Guid Id,
    string Name,
    Guid? LeadTeacherId,
    string? LeadFirstName,
    string? LeadLastName);
