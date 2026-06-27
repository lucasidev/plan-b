using Planb.Identity.Domain.TeacherProfiles.Events;
using Planb.Identity.Domain.Users;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Identity.Domain.TeacherProfiles;

/// <summary>
/// Aggregate root del reclamo de identidad docente (US-030). Un <see cref="User"/> con role=Member
/// reclama ser un <c>Teacher</c> del catálogo Academic; el profile nace pending y solo desbloquea la
/// capability <c>review:respond</c> (US-040) cuando se verifica (email institucional US-031 o
/// aprobación manual del admin). El estado conceptual (pending / verified) se deriva de los campos,
/// no hay columna <c>status</c> (ver verification-flows.md).
///
/// <para>
/// Por qué aggregate propio y no child de <see cref="User"/> (a diferencia de StudentProfile): el
/// invariante <c>UNIQUE(teacher_id) WHERE verified_at IS NOT NULL</c> (un docente tiene a lo sumo un
/// profile verificado) abarca profiles de <b>distintos</b> users, así que no es enforceable dentro
/// del boundary de un solo User. Además la verificación manual (UC-066) actúa sobre el profile sin
/// cargar al User que lo reclamó.
/// </para>
///
/// <para>
/// <see cref="TeacherId"/> es un UUID crudo (cross-BC, sin FK Postgres; ADR-0017). Que apunte a un
/// docente real y activo lo valida el handler vía <c>IAcademicQueryService</c> antes de invocar el
/// factory; los invariantes de rol / verificación del User (solo members verificados pueden
/// reclamar, ADR-0008) también viven en el handler porque el User es un aggregate aparte.
/// </para>
/// </summary>
public sealed class TeacherProfile : Entity<TeacherProfileId>, IAggregateRoot
{
    public UserId UserId { get; private set; }
    public Guid TeacherId { get; private set; }

    /// <summary>Email institucional ingresado para verificación (US-031). Null hasta el submit.</summary>
    public string? InstitutionalEmail { get; private set; }

    /// <summary>Cómo se verificó / se está verificando (US-031). Null en un claim recién creado.</summary>
    public TeacherVerificationMethod? VerificationMethod { get; private set; }

    public DateTimeOffset? VerifiedAt { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    // Tokens de verificación institucional (ADR-0033, reuso del child entity de Users). El aggregate
    // mantiene a lo sumo uno activo por purpose (issuing invalida el anterior). Para este profile el
    // único purpose es TeacherInstitutionalVerification.
    private readonly List<VerificationToken> _tokens = new();
    public IReadOnlyCollection<VerificationToken> Tokens => _tokens.AsReadOnly();

    /// <summary>
    /// El profile está verificado (habilita US-040). Estado derivado: no hay enum dedicado, el
    /// estado conceptual sale de la combinación de campos (verification-flows.md).
    /// </summary>
    public bool IsVerified => VerifiedAt is not null;

    private TeacherProfile() { }

    /// <summary>
    /// Inicia el claim (US-030): crea el profile en estado pending. El caller (handler) ya validó
    /// que el user sea un member verificado y activo, que el docente exista y esté activo en el
    /// catálogo, y que no haya un claim previo del mismo user al mismo docente.
    /// </summary>
    public static TeacherProfile InitiateClaim(UserId userId, Guid teacherId, IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        var now = clock.UtcNow;
        var profile = new TeacherProfile
        {
            Id = TeacherProfileId.New(),
            UserId = userId,
            TeacherId = teacherId,
            VerifiedAt = null,
            CreatedAt = now,
            UpdatedAt = now,
        };

        profile.Raise(new TeacherProfileClaimInitiatedDomainEvent(profile.Id, userId, teacherId, now));
        return profile;
    }

    /// <summary>
    /// Reconstitución con Id pre-asignado, para seeder y EF rehydration. Saltea validaciones: el
    /// caller (seed cerrado o repo cargando un row) se hace responsable de datos coherentes.
    /// </summary>
    public static TeacherProfile Hydrate(
        TeacherProfileId id,
        UserId userId,
        Guid teacherId,
        string? institutionalEmail,
        TeacherVerificationMethod? verificationMethod,
        DateTimeOffset? verifiedAt,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt) =>
        new()
        {
            Id = id,
            UserId = userId,
            TeacherId = teacherId,
            InstitutionalEmail = institutionalEmail,
            VerificationMethod = verificationMethod,
            VerifiedAt = verifiedAt,
            CreatedAt = createdAt,
            UpdatedAt = updatedAt,
        };

    /// <summary>
    /// Paso 1 de la verificación institucional (US-031): el owner ingresa su email institucional. El
    /// caller (handler) ya validó la propiedad del claim y trae los <paramref name="allowedDomains"/>
    /// de la universidad del docente (cross-BC). Acá se valida la forma del email + que su dominio
    /// pertenezca a la universidad, se setea el email + método, y se emite un token (invalidando el
    /// activo anterior, ADR-0033 one-active-per-purpose). El <paramref name="rawToken"/> lo genera el
    /// handler; este método lo guarda y el handler lo manda por mail. Idempotencia: re-submitear con
    /// el profile ya verificado devuelve <see cref="TeacherProfileErrors.AlreadyVerified"/>.
    /// </summary>
    public Result SubmitInstitutionalEmail(
        string email,
        IReadOnlyList<string> allowedDomains,
        string rawToken,
        TimeSpan ttl,
        IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(allowedDomains);
        ArgumentNullException.ThrowIfNull(clock);

        if (IsVerified)
        {
            return TeacherProfileErrors.AlreadyVerified;
        }

        var emailResult = EmailAddress.Create(email);
        if (emailResult.IsFailure)
        {
            return emailResult.Error;
        }

        var address = emailResult.Value;
        if (!allowedDomains.Contains(address.Domain))
        {
            return TeacherProfileErrors.InstitutionalEmailDomainNotAllowed;
        }

        var now = clock.UtcNow;
        foreach (var active in _tokens.Where(t =>
            t.Purpose == TokenPurpose.TeacherInstitutionalVerification && t.IsActive))
        {
            active.Invalidate(now);
        }

        _tokens.Add(new VerificationToken(
            Guid.NewGuid(), TokenPurpose.TeacherInstitutionalVerification, rawToken, now, now.Add(ttl)));

        InstitutionalEmail = address.Value;
        VerificationMethod = TeacherVerificationMethod.InstitutionalEmail;
        UpdatedAt = now;

        Raise(new TeacherProfileInstitutionalEmailSubmittedDomainEvent(
            Id, UserId, TeacherId, address.Value, now));
        return Result.Success();
    }

    /// <summary>
    /// Paso 2 de la verificación institucional (US-031): consume el token del link de mail y marca el
    /// profile como verificado. Idempotente: si ya está verificado (doble click), devuelve éxito sin
    /// re-stampar. El caller (handler) valida ANTES que no haya otro profile verificado para el mismo
    /// docente (partial UNIQUE teacher WHERE verified); este método no puede chequearlo porque ese
    /// invariante abarca otros aggregates.
    /// </summary>
    public Result VerifyByInstitutionalEmail(string rawToken, IDateTimeProvider clock)
    {
        ArgumentNullException.ThrowIfNull(clock);

        if (IsVerified)
        {
            return Result.Success();
        }

        if (string.IsNullOrWhiteSpace(rawToken))
        {
            return TeacherProfileErrors.VerificationTokenInvalid;
        }

        var token = _tokens.FirstOrDefault(t =>
            t.Purpose == TokenPurpose.TeacherInstitutionalVerification && t.Token == rawToken);

        if (token is null)
        {
            return TeacherProfileErrors.VerificationTokenInvalid;
        }
        if (token.IsInvalidated)
        {
            return TeacherProfileErrors.VerificationTokenInvalidated;
        }
        if (token.IsConsumed)
        {
            return TeacherProfileErrors.VerificationTokenAlreadyConsumed;
        }

        var now = clock.UtcNow;
        if (token.IsExpired(now))
        {
            return TeacherProfileErrors.VerificationTokenExpired;
        }

        token.Consume(now);
        VerifiedAt = now;
        VerificationMethod = TeacherVerificationMethod.InstitutionalEmail;
        UpdatedAt = now;

        Raise(new TeacherProfileVerifiedDomainEvent(Id, UserId, TeacherId, now));
        return Result.Success();
    }
}
