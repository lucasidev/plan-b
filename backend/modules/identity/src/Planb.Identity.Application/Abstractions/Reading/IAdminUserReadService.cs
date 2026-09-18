using Planb.Identity.Application.Features.AdminUsers;

namespace Planb.Identity.Application.Abstractions.Reading;

public interface IAdminUserReadService
{
    Task<AdminUserPage> ListAsync(string search, string status, int page, CancellationToken ct);
    Task<bool> CanAuthenticateAsync(Guid userId, int accessVersion, CancellationToken ct);
}
