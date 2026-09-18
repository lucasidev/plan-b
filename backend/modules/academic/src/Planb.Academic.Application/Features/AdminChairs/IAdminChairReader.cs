namespace Planb.Academic.Application.Features.AdminChairs;

/// <summary>
/// Las cátedras de una materia como las ve el backoffice (US-196): con su equipo entero, incluidos
/// los tramos cerrados y las cátedras archivadas.
///
/// <para>
/// Es un read distinto del público (<c>IAcademicQueryService.ListChairsBySubjectAsync</c>), que solo
/// devuelve las activas con su titular vigente. Quien carga necesita ver lo que archivó y a quién
/// cerró, porque si no no puede corregirse.
/// </para>
/// </summary>
public interface IAdminChairReader
{
    Task<ChairSubjectContext?> GetSubjectContextAsync(Guid subjectId, CancellationToken ct = default);

    Task<IReadOnlyList<AdminChairListItem>> ListBySubjectAsync(
        Guid subjectId, CancellationToken ct = default);
}

/// <summary>Una cátedra en el listado del backoffice, con su equipo.</summary>
public sealed record AdminChairListItem(
    Guid Id,
    string Name,
    bool IsActive,
    IReadOnlyList<AdminChairMemberItem> Members);

/// <summary>
/// Un integrante con su vigencia. <paramref name="UntilTermLabel"/> es null mientras integra: eso
/// es lo que distingue el equipo de hoy del de hace tres años, y es el dato que impide atribuirle
/// al titular actual lo que se dictó antes de que llegara.
/// </summary>
public sealed record AdminChairMemberItem(
    Guid TeacherId,
    string FirstName,
    string LastName,
    string Role,
    Guid SinceTermId,
    string SinceTermLabel,
    string? UntilTermLabel);

public sealed record ChairSubjectContext(
    Guid SubjectId, string SubjectName, bool SubjectIsActive,
    Guid CareerPlanId, int PlanYear,
    Guid CareerId, string CareerName,
    Guid UniversityId, string UniversityName);
