namespace Planb.Identity.Application.Features.ChangePassword;

/// <summary>
/// Body del PATCH /api/me/password. Solo dos campos: la verificación de "confirmar nueva
/// password" vive client-side (el handler no la necesita).
/// </summary>
public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);
