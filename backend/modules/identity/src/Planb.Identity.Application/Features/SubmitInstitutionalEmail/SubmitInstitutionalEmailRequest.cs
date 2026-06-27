namespace Planb.Identity.Application.Features.SubmitInstitutionalEmail;

/// <summary>Body de POST /api/me/teacher-claims/{id}/institutional-email (US-031).</summary>
public sealed record SubmitInstitutionalEmailRequest(string Email);
