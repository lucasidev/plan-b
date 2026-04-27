using Planb.Identity.Application.Abstractions.Security;

namespace Planb.Identity.Application.Features.SignIn;

/// <summary>
/// Body of a successful sign-in. The tokens themselves go in httpOnly cookies set by the
/// endpoint; the body carries minimal user info so the frontend can render right away
/// without an extra round-trip.
/// </summary>
public sealed record SignInResponse(
    Guid UserId,
    string Email,
    string Role)
{
    /// <summary>
    /// Tokens are kept out of the JSON response (per ADR-0023 they live in cookies). The
    /// endpoint reads this property to set the cookies and then strips it before serializing.
    /// </summary>
    [System.Text.Json.Serialization.JsonIgnore]
    public AuthTokens? Tokens { get; init; }
}
