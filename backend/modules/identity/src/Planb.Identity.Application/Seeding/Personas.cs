using System.ComponentModel.DataAnnotations;

namespace Planb.Identity.Application.Seeding;

/// <summary>
/// Schema of a single persona entry. Data lives in
/// <c>backend/host/Planb.Api/seed-data/personas.json</c> and is bound at startup via the
/// Options pattern (<see cref="SeedPersonasOptions"/>). Source of truth for the catalog:
/// <c>docs/domain/personas.md</c>.
/// </summary>
public sealed class PersonaConfig
{
    [Required]
    [EmailAddress]
    public string Email { get; init; } = string.Empty;

    [Required]
    [MinLength(12)]
    public string Password { get; init; } = string.Empty;

    [Required]
    public PersonaState State { get; init; }

    [Required]
    public string DisplayName { get; init; } = string.Empty;
}

public enum PersonaState
{
    /// <summary>Verified, active member. Login happy path.</summary>
    VerifiedActive,

    /// <summary>Verified but disabled. Login should yield 403 disabled.</summary>
    Disabled,

    /// <summary>Registered, never verified. Login should yield 403 not verified.</summary>
    Unverified,
}

/// <summary>
/// Options-pattern target for the seed personas list. Bound from the
/// <see cref="SectionName"/> section of <c>seed-data/personas.json</c> in the host.
/// </summary>
public sealed class SeedPersonasOptions
{
    public const string SectionName = "Seed";

    [Required]
    public IReadOnlyList<PersonaConfig> Personas { get; init; } = [];
}
