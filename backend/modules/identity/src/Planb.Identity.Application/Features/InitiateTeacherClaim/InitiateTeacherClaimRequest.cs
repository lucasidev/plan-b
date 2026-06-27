namespace Planb.Identity.Application.Features.InitiateTeacherClaim;

/// <summary>Body de POST /api/me/teacher-claims (US-030). Solo el docente reclamado.</summary>
public sealed record InitiateTeacherClaimRequest(Guid TeacherId);
