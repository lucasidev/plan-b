using Microsoft.Extensions.Logging;
using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Application.Abstractions.Security;
using Planb.Identity.Domain.Users;
using Planb.SharedKernel.Abstractions.Clock;

namespace Planb.Identity.Application.Seeding;

/// <summary>
/// Materializa autores demo (ghost students) para el corpus de reseñas: User verificado +
/// StudentProfile activo, uno por <see cref="DemoAuthorSpec"/>. NO son las personas canónicas de
/// login (esas las seedea <see cref="IdentitySeeder"/>); existen solo para que el corpus de
/// reseñas tenga múltiples autores y las features cross-user (votos, reportes) sean demostrables
/// sin armar datos a mano. Anónimos en la UI (ADR-0009): su identidad nunca se expone.
///
/// Idempotente por email: un autor ya existente se recupera (no se re-crea) para que el
/// orquestador pueda mapear su profileId aun en un re-run.
/// </summary>
public sealed class DemoAuthorsSeeder
{
    private readonly IUserRepository _users;
    private readonly IIdentityUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwords;
    private readonly IDateTimeProvider _clock;
    private readonly ILogger<DemoAuthorsSeeder> _log;

    public DemoAuthorsSeeder(
        IUserRepository users,
        IIdentityUnitOfWork unitOfWork,
        IPasswordHasher passwords,
        IDateTimeProvider clock,
        ILogger<DemoAuthorsSeeder> log)
    {
        _users = users;
        _unitOfWork = unitOfWork;
        _passwords = passwords;
        _clock = clock;
        _log = log;
    }

    /// <summary>
    /// Asegura cada autor y devuelve un mapa <c>Key → (userId, profileId)</c> para que el
    /// orquestador ancle cursadas y resuelva los votantes.
    /// </summary>
    public async Task<IReadOnlyDictionary<string, DemoAuthorResult>> SeedAsync(
        IReadOnlyList<DemoAuthorSpec> authors, CancellationToken ct = default)
    {
        var result = new Dictionary<string, DemoAuthorResult>();
        var created = 0;

        foreach (var spec in authors)
        {
            var emailResult = EmailAddress.Create(spec.Email);
            if (emailResult.IsFailure)
            {
                _log.LogWarning("Demo author email invalid: {Email}. Skipping.", spec.Email);
                continue;
            }
            var email = emailResult.Value;

            var existing = await _users.FindByEmailAsync(email, ct);
            if (existing is not null)
            {
                var existingProfile = existing.StudentProfiles.FirstOrDefault(p => p.IsActive);
                if (existingProfile is not null)
                {
                    result[spec.Key] = new DemoAuthorResult(existing.Id.Value, existingProfile.Id.Value);
                }
                continue;
            }

            var registerResult = User.Register(email, _passwords.Hash(spec.Password), _clock);
            if (registerResult.IsFailure)
            {
                _log.LogWarning(
                    "Demo author register failed for {Email}: {Error}", spec.Email, registerResult.Error.Code);
                continue;
            }
            var user = registerResult.Value;

            // AddStudentProfile exige un user verificado: emitimos y consumimos un token de verificación
            // (mismo truco que IdentitySeeder para las personas verified+active).
            var token = $"seed-demo-{spec.Key}";
            user.IssueVerificationToken(TokenPurpose.UserEmailVerification, token, TimeSpan.FromHours(24), _clock);
            user.VerifyEmail(token, _clock);

            var profileResult = user.AddStudentProfile(spec.CareerPlanId, spec.CareerId, spec.EnrollmentYear, _clock);
            if (profileResult.IsFailure)
            {
                _log.LogWarning(
                    "Demo author AddStudentProfile failed for {Email}: {Error}", spec.Email, profileResult.Error.Code);
                continue;
            }

            _users.Add(user);
            result[spec.Key] = new DemoAuthorResult(user.Id.Value, profileResult.Value.Id.Value);
            created++;
        }

        if (created > 0)
        {
            await _unitOfWork.SaveChangesAsync(ct);
            _log.LogInformation("Seeded {Count} demo authors.", created);
        }

        return result;
    }
}

/// <summary>Spec plano de un autor demo. El orquestador (host) lo arma desde el manifiesto.</summary>
public sealed record DemoAuthorSpec(
    string Key, string Email, string Password, Guid CareerPlanId, Guid CareerId, int EnrollmentYear);

/// <summary>IDs materializados de un autor demo, para anclar cursadas y resolver votantes.</summary>
public sealed record DemoAuthorResult(Guid UserId, Guid ProfileId);
