namespace Planb.Identity.Application.Features.InitiateTeacherClaim;

/// <summary>
/// Respuesta de POST /api/me/teacher-claims (US-030). Devuelve el id del claim recién creado +
/// el docente + el estado de verificación (siempre false al crear: el claim nace pending).
/// </summary>
public sealed record InitiateTeacherClaimResponse(Guid ClaimId, Guid TeacherId, bool IsVerified);
