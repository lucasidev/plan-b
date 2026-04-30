namespace Planb.Identity.Application.Features.ResetPassword;

public sealed record ResetPasswordRequest(string Token, string NewPassword);
