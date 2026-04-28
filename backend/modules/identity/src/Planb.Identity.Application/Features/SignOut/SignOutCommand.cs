namespace Planb.Identity.Application.Features.SignOut;

/// <summary>
/// Sign-out request. The refresh token comes from the HTTP-only cookie via the endpoint;
/// it can be null/empty when the caller has no session, in which case the handler treats
/// the call as a no-op (idempotency requirement of US-029-i).
/// </summary>
/// <param name="RefreshToken">Raw refresh token from the planb_refresh cookie, or null/empty.</param>
public sealed record SignOutCommand(string? RefreshToken);
