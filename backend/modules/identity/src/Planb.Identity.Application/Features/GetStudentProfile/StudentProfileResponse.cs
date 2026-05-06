namespace Planb.Identity.Application.Features.GetStudentProfile;

/// <summary>
/// Shape de respuesta de GET /api/me/student-profiles. Caller principal: el frontend en US-037
/// para el guard "user tiene profile activo" del layout (member); también lo usará US-047
/// (Mi perfil) para hidratar la pantalla de view/edit.
///
/// Plano sin nesting porque el caller hoy solo necesita IDs + meta. Si en el futuro el detalle
/// del perfil agrega más campos (display name, foto, legajo), se agrega acá manteniendo el
/// orden estable.
/// </summary>
public sealed record StudentProfileResponse(
    Guid Id,
    Guid UserId,
    Guid CareerId,
    Guid CareerPlanId,
    int EnrollmentYear,
    string Status);
