using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Identity.Domain.Users;
using Planb.SharedKernel.Abstractions.Clock;

namespace Planb.Identity.Application.Seeding;

/// <summary>
/// Materializes the persona catalog (read from <see cref="SeedPersonasOptions"/>) into User
/// aggregates the first time it runs. Idempotent: re-runs skip personas that already exist
/// (matched by email). The hosted service that drives this lives in the host project.
/// </summary>
public sealed class IdentitySeeder
{
    private readonly IUserRepository _users;
    private readonly IIdentityUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwords;
    private readonly IDateTimeProvider _clock;
    private readonly IOptions<SeedPersonasOptions> _options;
    private readonly ILogger<IdentitySeeder> _log;

    public IdentitySeeder(
        IUserRepository users,
        IIdentityUnitOfWork unitOfWork,
        IPasswordHasher passwords,
        IDateTimeProvider clock,
        IOptions<SeedPersonasOptions> options,
        ILogger<IdentitySeeder> log)
    {
        _users = users;
        _unitOfWork = unitOfWork;
        _passwords = passwords;
        _clock = clock;
        _options = options;
        _log = log;
    }

    public async Task SeedAsync(CancellationToken ct = default)
    {
        var personas = _options.Value.Personas;
        if (personas.Count == 0)
        {
            _log.LogInformation("No seed personas configured, skipping.");
            return;
        }

        var created = 0;

        foreach (var persona in personas)
        {
            var emailResult = EmailAddress.Create(persona.Email);
            if (emailResult.IsFailure)
            {
                _log.LogWarning(
                    "Persona email invalid: {Email} ({Error}). Skipping.",
                    persona.Email, emailResult.Error.Code);
                continue;
            }
            var email = emailResult.Value;

            if (await _users.ExistsByEmailAsync(email, ct))
            {
                continue;
            }

            var registerResult = User.Register(
                email, _passwords.Hash(persona.Password), _clock);
            if (registerResult.IsFailure)
            {
                _log.LogWarning(
                    "Persona register failed for {Email}: {Error}",
                    persona.Email, registerResult.Error.Code);
                continue;
            }
            var user = registerResult.Value;

            ApplyState(user, persona);
            ApplyStudentProfile(user, persona);
            _users.Add(user);
            created++;
        }

        if (created > 0)
        {
            await _unitOfWork.SaveChangesAsync(ct);
            _log.LogInformation(
                "Seeded {Count} dev personas (out of {Total} configured).",
                created, personas.Count);
        }
    }

    private void ApplyState(User user, PersonaConfig persona)
    {
        switch (persona.State)
        {
            case PersonaState.VerifiedActive:
                IssueAndConsumeVerificationToken(user);
                break;

            case PersonaState.Disabled:
                // Verify first (a disabled-but-unverified account is unreachable by design),
                // then disable.
                IssueAndConsumeVerificationToken(user);
                user.Disable(
                    disabledBy: Guid.Empty,
                    reason: "Seed: persona for testing 403 disabled path",
                    _clock);
                break;

            case PersonaState.Unverified:
                // Issue a token but don't consume it — account stays pending-verification.
                user.IssueVerificationToken(
                    TokenPurpose.UserEmailVerification,
                    token: $"seed-{persona.Email.Split('@')[0]}",
                    ttl: TimeSpan.FromHours(24),
                    _clock);
                break;
        }
    }

    private void IssueAndConsumeVerificationToken(User user)
    {
        var token = $"seed-verify-{user.Email.Value.Split('@')[0]}";
        user.IssueVerificationToken(
            TokenPurpose.UserEmailVerification, token, TimeSpan.FromHours(24), _clock);
        user.VerifyEmail(token, _clock);
    }

    private void ApplyStudentProfile(User user, PersonaConfig persona)
    {
        if (persona.StudentProfile is null)
        {
            return;
        }

        // Solo personas verified+active pueden tener profile (el aggregate invariante también
        // lo enforce: lo dejamos defensivo acá para fallar limpio en el seed sin ruido).
        if (persona.State != PersonaState.VerifiedActive)
        {
            _log.LogWarning(
                "Persona {Email} has StudentProfile config but state is {State}. Skipping profile.",
                persona.Email, persona.State);
            return;
        }

        var result = user.AddStudentProfile(
            careerPlanId: persona.StudentProfile.CareerPlanId,
            careerId: persona.StudentProfile.CareerId,
            enrollmentYear: persona.StudentProfile.EnrollmentYear,
            clock: _clock);

        if (result.IsFailure)
        {
            _log.LogWarning(
                "AddStudentProfile failed for {Email}: {Error}. Persona sin profile, va a onboarding tras sign-in.",
                persona.Email, result.Error.Code);
        }
    }
}
