namespace Planb.Identity.Application.Features.GetStudentProfile;

/// <summary>
/// Shape de respuesta de GET /api/me/student-profile. Caller principal: el guard del layout
/// (member) de US-037-f (chequea "tiene profile activo" para decidir si redirigir a onboarding)
/// y la pantalla Mi perfil de US-047 (view + edit datos académicos).
///
/// <para>
/// Property-init (sin constructor positional) para que Dapper pueda materializar el record
/// con el parameterless constructor que el compiler genera. El constructor positional fallaría
/// porque Dapper no resuelve nullables a través del matching de signature; con property-init
/// usa el setter por nombre de columna y los nullables funcionan naturalmente.
/// </para>
/// </summary>
public sealed record StudentProfileResponse
{
    public Guid Id { get; init; }
    public Guid UserId { get; init; }
    public Guid CareerId { get; init; }
    public Guid CareerPlanId { get; init; }
    public int EnrollmentYear { get; init; }
    public string Status { get; init; } = null!;
    // US-047: campos editables desde Mi perfil. Nullable si el user nunca editó.
    public string? DisplayName { get; init; }
    public int? YearOfStudy { get; init; }
    public string? Legajo { get; init; }
    public bool RegularStudent { get; init; }
    public DateTimeOffset? UpdatedAt { get; init; }
    // US-047: header del perfil (no editables desde acá).
    public string Email { get; init; } = null!;
    public DateTimeOffset MemberSince { get; init; }
}
