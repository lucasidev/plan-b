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

    /// <summary>
    /// Optional StudentProfile to attach at seed time. Si está presente, después de aplicar el
    /// estado (verified / disabled / unverified) el seeder le agrega el profile. Sirve para
    /// que personas como Lucía aterricen directo en /home tras el sign-in (el guard del
    /// frontend redirige a /onboarding/welcome si no hay profile). Mateo deliberadamente NO
    /// trae profile para cubrir el path de "user nuevo va a onboarding" en E2E specs.
    /// </summary>
    public PersonaStudentProfile? StudentProfile { get; init; }
}

/// <summary>
/// Coordenadas mínimas para crear un StudentProfile al seed. CareerPlanId y CareerId vienen del
/// catálogo de Academic (constantes en <c>AcademicSeedData</c>), pero acá los recibimos como
/// Guid para no acoplar este módulo a Academic en la binding del JSON.
/// </summary>
public sealed class PersonaStudentProfile
{
    [Required]
    public Guid CareerPlanId { get; init; }

    [Required]
    public Guid CareerId { get; init; }

    [Required]
    [Range(1990, 2100)]
    public int EnrollmentYear { get; init; }
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
