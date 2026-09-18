using Planb.Identity.Domain.Users;

namespace Planb.Identity.Application.Features.AdminUsers;

public sealed record ChangeUserAccessCommand(UserId UserId, Guid ActorId, bool Suspend, string? Reason);
