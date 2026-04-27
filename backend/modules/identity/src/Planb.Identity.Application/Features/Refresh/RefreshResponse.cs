using Planb.Identity.Application.Abstractions.Security;

namespace Planb.Identity.Application.Features.Refresh;

public sealed record RefreshResponse(Guid UserId, string Email, string Role)
{
    [System.Text.Json.Serialization.JsonIgnore]
    public AuthTokens? Tokens { get; init; }
}
