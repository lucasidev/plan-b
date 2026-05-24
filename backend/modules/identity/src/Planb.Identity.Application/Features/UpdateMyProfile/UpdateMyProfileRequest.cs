namespace Planb.Identity.Application.Features.UpdateMyProfile;

/// <summary>
/// Body del PATCH /api/me/student-profile (US-047). Todos los campos nullable: el cliente
/// envía solo los que cambia (PATCH semantics). Si el body llega vacío, el validator devuelve
/// 400.
/// </summary>
public sealed record UpdateMyProfileRequest(
    string? DisplayName,
    int? YearOfStudy,
    string? Legajo,
    bool? RegularStudent);
