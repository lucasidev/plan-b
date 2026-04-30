namespace Planb.Identity.Application.Features.ResetPassword;

public sealed record ResetPasswordCommand(string Token, string NewPassword);
