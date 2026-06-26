namespace Planb.Academic.Application.Contracts;

/// <summary>
/// Una comisión de una materia en un cuatrimestre, con sus docentes (US-065). Caller: el listado
/// público de comisiones por materia + term (picker de la cursada y página de materia/docente).
/// <see cref="Modality"/> viene como string (PascalCase del enum). Los nombres de docente vienen en
/// title case listos para display (el storage es lowercase normalizado).
/// </summary>
public sealed record CommissionListItem(
    Guid Id,
    string Name,
    string Modality,
    int? Capacity,
    IReadOnlyList<CommissionTeacherItem> Teachers);

/// <summary>Un docente asignado a una comisión, con su rol (string PascalCase del enum).</summary>
public sealed record CommissionTeacherItem(
    Guid TeacherId,
    string FirstName,
    string LastName,
    string Role);
