namespace Planb.Identity.Application.Features.VerifyTeacherClaim;

/// <summary>Body de POST /api/me/teacher-claims/verify (US-031): el token crudo del link de mail.</summary>
public sealed record VerifyTeacherClaimRequest(string Token);
