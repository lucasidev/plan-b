namespace Planb.Planning.Application.Features.GetAvailableSubjects;

/// <summary>
/// Una comisión activa de una materia en un término puntual, con sus docentes y horario (US-096).
/// Aparece en <see cref="AvailableSubjectItem.Commissions"/> solo cuando el caller de
/// GET /api/me/simulator/available pasó <c>termId</c>; sin ese query param, viaja vacía.
/// </summary>
/// <param name="TeacherNames">Nombres "Apellido, Nombre" en title case, titular primero.</param>
public sealed record AvailableCommissionItem(
    Guid Id,
    string Name,
    string Modality,
    int? Capacity,
    IReadOnlyList<string> TeacherNames,
    IReadOnlyList<SimulatorScheduleItem> Schedule);
