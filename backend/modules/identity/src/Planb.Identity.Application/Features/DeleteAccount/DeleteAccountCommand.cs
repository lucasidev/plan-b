using Planb.Identity.Domain.Users;

namespace Planb.Identity.Application.Features.DeleteAccount;

/// <summary>
/// Self-service deletion command (UC-038). The <see cref="UserId"/> is read from the session
/// claims by the endpoint, never from the request body: there is no admin path to delete
/// another user, so accepting a UserId from outside the session would be unsafe.
/// </summary>
public sealed record DeleteAccountCommand(UserId UserId);
