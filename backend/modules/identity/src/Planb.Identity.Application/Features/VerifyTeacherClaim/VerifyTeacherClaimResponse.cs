namespace Planb.Identity.Application.Features.VerifyTeacherClaim;

/// <summary>Respuesta de POST /api/me/teacher-claims/verify (US-031). IsVerified = true en el happy path.</summary>
public sealed record VerifyTeacherClaimResponse(Guid ClaimId, Guid TeacherId, bool IsVerified);
