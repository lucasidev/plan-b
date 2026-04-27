using System.ComponentModel.DataAnnotations;

namespace Planb.Identity.Infrastructure.Security;

public sealed class JwtOptions
{
    public const string SectionName = "JWT";

    [Required]
    [MinLength(32)]
    public string Secret { get; init; } = string.Empty;

    [Required]
    public string Issuer { get; init; } = "planb";

    [Required]
    public string Audience { get; init; } = "planb";

    [Range(1, 60 * 24)]
    public int AccessTokenMinutes { get; init; } = 15;

    [Range(1, 365)]
    public int RefreshTokenDays { get; init; } = 30;
}
