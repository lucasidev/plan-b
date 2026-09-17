namespace Planb.Academic.Application.Contracts;

/// <summary>
/// Metadata completa de un docente, por id. Caller: la página pública de docente (US-003), que
/// muestra nombre + título + bio + foto arriba de los agregados y las reseñas. <see cref="IsActive"/>
/// permite que el caller decida si mostrar un banner de docente
/// dado de baja del catálogo sin perder las reseñas históricas.
/// </summary>
public sealed record TeacherDetailItem(
    Guid Id,
    Guid UniversityId,
    string FirstName,
    string LastName,
    string? Title,
    string? Bio,
    string? PhotoUrl,
    bool IsActive);
