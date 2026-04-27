namespace Planb.Identity.Application.Features.Refresh;

/// <param name="RefreshToken">Raw refresh token from the planb_refresh cookie.</param>
public sealed record RefreshCommand(string RefreshToken);
